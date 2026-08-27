import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'distribution-points.json');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

function writePoints(points) {
  try {
    // ১. data ফোল্ডার না থাকলে স্বয়ংক্রিয়ভাবে তৈরি করবে
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // ২. ফাইলে ডাটা সেভ করবে
    fs.writeFileSync(DATA_FILE, JSON.stringify(points, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing points:', error);
    return false;
  }
}

function normalizeKey(key) {
  return String(key).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

const LAT_KEYS = ['latitude', 'lat', 'lattitude', 'latit', 'y', 'ycoordinate', 'latitudes'];
const LNG_KEYS = ['longitude', 'lng', 'long', 'lon', 'longitute', 'longitudes', 'longit', 'x', 'xcoordinate'];
const NAME_KEYS = ['name', 'pointname', 'point', 'title', 'label', 'locationname', 'site', 'sitename', 'address'];
const ADDR_KEYS = ['address', 'location', 'addr', 'street', 'area', 'place', 'locationname'];
const EQUIP_KEYS = ['equipmenttype', 'type', 'equipment', 'category', 'equip', 'eqtype'];

function findKey(keys, candidates) {
  for (const c of candidates) {
    if (keys.includes(c)) return c;
  }
  return null;
}

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    const sampleKeys = rawData.length > 0 ? Object.keys(rawData[0]) : [];
    const normalizedKeys = sampleKeys.map(normalizeKey);

    const latKey = findKey(normalizedKeys, LAT_KEYS);
    const lngKey = findKey(normalizedKeys, LNG_KEYS);
    const nameKey = findKey(normalizedKeys, NAME_KEYS);
    const addrKey = findKey(normalizedKeys, ADDR_KEYS);
    const equipKey = findKey(normalizedKeys, EQUIP_KEYS);

    console.log('Upload detected columns:', sampleKeys);
    console.log('Matched lat:', latKey, 'lng:', lngKey, 'name:', nameKey, 'addr:', addrKey);

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    const points = readPoints();

    for (const row of rawData) {
      const normalizedRow = {};
      for (const key in row) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          normalizedRow[normalizeKey(key)] = row[key];
        }
      }

      let lat = null;
      let lng = null;

      if (latKey && lngKey) {
        lat = parseFloat(normalizedRow[latKey]);
        lng = parseFloat(normalizedRow[lngKey]);
      } else {
        for (const key of Object.keys(normalizedRow)) {
          const val = parseFloat(normalizedRow[key]);
          if (!isNaN(val)) {
            if (lat === null && val >= -90 && val <= 90 && key !== 'x' && key !== 'y') {
              lat = val;
            } else if (lng === null && val >= -180 && val <= 180) {
              lng = val;
            }
          }
        }
      }

      const name = nameKey ? normalizedRow[nameKey] : `Point ${insertedCount + skippedCount + 1}`;
      const address = addrKey ? normalizedRow[addrKey] : '';
      let equipmentType = '';
      if (equipKey && normalizedRow[equipKey]) {
        const raw = String(normalizedRow[equipKey]).trim();
        if (/^pop$/i.test(raw)) equipmentType = 'POP';
        else if (/splitter/i.test(raw)) equipmentType = 'Splitter';
        else equipmentType = raw;
      }

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        points.push({
          id: Date.now() + Math.random(),
          name: String(name || `Point ${insertedCount + skippedCount + 1}`),
          latitude: lat,
          longitude: lng,
          address: String(address || ''),
          equipmentType
        });
        insertedCount++;
      } else {
        skippedCount++;
        if (rawData.length <= 10) {
          errors.push(`Row ${insertedCount + skippedCount}: lat=${lat}, lng=${lng}`);
        }
      }
    }

    if (writePoints(points)) {
      res.json({
        message: 'Upload complete',
        inserted: insertedCount,
        skipped: skippedCount,
        detectedColumns: sampleKeys,
        matchedLatColumn: latKey,
        matchedLngColumn: lngKey,
        matchedEquipColumn: equipKey,
        sampleErrors: errors.slice(0, 10)
      });
    } else {
      res.status(500).json({ error: 'Failed to save points' });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/debug', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    const sampleKeys = rawData.length > 0 ? Object.keys(rawData[0]) : [];
    const normalizedKeys = sampleKeys.map(normalizeKey);

    const latKey = findKey(normalizedKeys, LAT_KEYS);
    const lngKey = findKey(normalizedKeys, LNG_KEYS);

    res.json({
      totalRows: rawData.length,
      detectedColumns: sampleKeys,
      normalizedKeys,
      matchedLatColumn: latKey,
      matchedLngColumn: lngKey,
      firstRow: rawData[0] || null,
      sampleRows: rawData.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/points', (req, res) => {
  try {
    const points = readPoints();
    res.json(points);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/points/:id', (req, res) => {
  try {
    const points = readPoints();
    const filtered = points.filter(p => p.id !== req.params.id);
    if (writePoints(filtered)) {
      res.json({ message: 'Point deleted' });
    } else {
      res.status(500).json({ error: 'Failed to delete point' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/points', (req, res) => {
  try {
    if (writePoints([])) {
      res.json({ message: 'All points deleted' });
    } else {
      res.status(500).json({ error: 'Failed to delete points' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;