import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './components/MapComponent.jsx';
import DistanceInput from './components/DistanceInput.jsx';
import FiberDistanceUpload from './components/FiberDistanceUpload.jsx';

const API_URL = '/api';

function AppContent() {
  const [points, setPoints] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchPoints();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setPanelOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchPoints = async () => {
    try {
      const response = await axios.get(`${API_URL}/upload/points`);
      setPoints(response.data);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const calculateDistance = async (lat, lng) => {
    setLoading(true);
    setResult(null);
    try {
      const response = await axios.post(`${API_URL}/distance/calculate-distance`, {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      });
      setResult(response.data);
      setSelectedPoint(response.data.nearestPoint);
    } catch (error) {
      console.error('Error calculating distance:', error);
      setResult({ error: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  const togglePanel = () => {
    setPanelOpen(prev => !prev);
  };

  const panelStyle = {
    width: isMobile ? '100%' : '350px',
    background: '#f5f5f5',
    padding: '20px',
    overflowY: 'auto',
    borderRight: isMobile ? 'none' : '1px solid #ddd',
    position: isMobile ? 'absolute' : 'relative',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1000,
    transform: isMobile ? (panelOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
    transition: 'transform 0.3s ease-in-out',
    display: 'flex',
    flexDirection: 'column'
  };

  const mapStyle = {
    flex: 1,
    position: 'relative',
    width: '100%'
  };

  const toggleButtonStyle = {
    position: 'fixed',
    top: '10px',
    left: isMobile && panelOpen ? 'calc(100% - 50px)' : '10px',
    zIndex: 1100,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#1a237e',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    display: isMobile ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    transition: 'left 0.3s ease-in-out'
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 999,
    display: isMobile && panelOpen ? 'block' : 'none'
  };

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0, color: '#333', fontSize: '18px' }}>GeoFiber Tools</h2>
            {isMobile && (
              <button
                onClick={togglePanel}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            )}
          </div>
          <DistanceInput onCalculate={calculateDistance} loading={loading} />

          {result && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: result.error ? '#ffebee' : '#e8f5e9',
              borderRadius: '8px',
              border: `1px solid ${result.error ? '#f44336' : '#4caf50'}`
            }}>
              <h3 style={{ marginTop: 0, color: result.error ? '#c62828' : '#2e7d32' }}>
                {result.error ? 'Error' : 'Result'}
              </h3>
              {result.error ? (
                <p style={{ margin: 0, fontSize: '14px' }}>{result.error}</p>
              ) : (
                <div style={{ fontSize: '14px' }}>
                  <p><strong>Input Point:</strong> ({result.inputPoint.latitude.toFixed(6)}, {result.inputPoint.longitude.toFixed(6)})</p>
                  <p><strong>Nearest Point:</strong> {result.nearestPoint.name}</p>
                  {result.nearestPoint.equipmentType && <p><strong>Type:</strong> {result.nearestPoint.equipmentType}</p>}
                  <p><strong>Coordinates:</strong> ({result.nearestPoint.latitude.toFixed(6)}, {result.nearestPoint.longitude.toFixed(6)})</p>
                  {result.nearestPoint.address && <p><strong>Address:</strong> {result.nearestPoint.address}</p>}
                  <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '10px 0' }} />
                  <p><strong>Straight-line Distance:</strong> {result.straightLineDistance} km</p>
                  {result.fiberDistance ? (
                    <p style={{ color: '#1565c0' }}>
                      <strong>Fiber Distance:</strong> {result.fiberDistance} meter
                    </p>
                  ) : null}
                  {result.roadDistance ? (
                    <p style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                      <strong>Walking Distance:</strong> {result.roadDistance} km
                    </p>
                  ) : (
                    <p style={{ color: '#f57c00' }}>
                      <strong>Walking Distance:</strong> {result.roadDistanceError || 'Not available'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <FiberDistanceUpload />
        </div>

        <div style={mapStyle}>
          <MapComponent
            points={points}
            selectedPoint={selectedPoint}
            result={result}
          />
        </div>
      </div>

      <button onClick={togglePanel} style={toggleButtonStyle}>
        {panelOpen ? '✕' : '☰'}
      </button>

      <div style={overlayStyle} onClick={togglePanel} />
    </>
  );
}

export default AppContent;
