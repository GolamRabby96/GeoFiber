import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const DATA_FILE = path.join(process.cwd(), 'data', 'distribution-points.json');

function readPoints() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading points:', error);
  }
  return [];
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.post('/calculate-distance', (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const points = readPoints();

    if (points.length === 0) {
      return res.status(404).json({ error: 'No distribution points in database. Please upload Excel data first.' });
    }

    let nearestPoint = null;
    let minDistance = Infinity;

    for (const point of points) {
      const dist = haversineDistance(lat, lng, point.latitude, point.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestPoint = point;
      }
    }

    if (!nearestPoint) {
      return res.status(404).json({ error: 'No nearby distribution points found' });
    }

    let roadDistance = null;
    let roadError = null;
    let routeCoordinates = [];

    (async () => {
      try {
        const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${lng},${lat};${nearestPoint.longitude},${nearestPoint.latitude}?overview=full&geometries=geojson`;
        const response = await axios.get(osrmUrl, { timeout: 10000 });

        if (response.data.code === 'Ok' && response.data.routes && response.data.routes.length > 0) {
          const route = response.data.routes[0];
          roadDistance = (route.distance / 1000).toFixed(2);
          if (route.geometry && route.geometry.coordinates) {
            routeCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          }
        }
      } catch (error) {
        roadError = 'Could not calculate road distance using OSRM';
      }

      const fiberDistance = roadDistance ? (parseFloat(roadDistance) * 1000 * 1.3).toFixed(0) : null;

      res.json({
        nearestPoint: {
          id: nearestPoint.id,
          name: nearestPoint.name,
          latitude: nearestPoint.latitude,
          longitude: nearestPoint.longitude,
          address: nearestPoint.address,
          equipmentType: nearestPoint.equipmentType || ''
        },
        inputPoint: {
          latitude: lat,
          longitude: lng
        },
        straightLineDistance: minDistance.toFixed(2),
        fiberDistance: fiberDistance,
        roadDistance: roadDistance,
        roadDistanceError: roadError,
        routeCoordinates: routeCoordinates,
        unit: 'km'
      });
    })();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/nearest/:lat/:lng', (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const points = readPoints();

    const pointsWithDistance = points.map(point => ({
      ...point,
      distance: haversineDistance(lat, lng, point.latitude, point.longitude)
    })).sort((a, b) => a.distance - b.distance).slice(0, 10);

    res.json(pointsWithDistance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
