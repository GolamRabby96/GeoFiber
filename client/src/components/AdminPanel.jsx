import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FileUpload from './FileUpload';

const API_URL = '/api';

function AdminPanel() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      const response = await axios.get(`${API_URL}/upload/points`);
      setPoints(response.data);
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllPoints = async () => {
    if (!window.confirm('Are you sure you want to delete ALL distribution points? This cannot be undone.')) return;

    try {
      await axios.delete(`${API_URL}/upload/points`);
      setPoints([]);
      alert('All points deleted successfully');
    } catch (error) {
      alert('Failed to delete points');
    }
  };

  const deletePoint = async (id) => {
    if (!window.confirm('Are you sure you want to delete this point?')) return;

    try {
      await axios.delete(`${API_URL}/upload/points/${id}`);
      setPoints(points.filter(p => p._id !== id));
    } catch (error) {
      alert('Failed to delete point');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f5f5f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#333' }}>Admin Panel - Distribution Points</h2>
            <button onClick={clearAllPoints} style={{ padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              Clear All Points
            </button>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>Upload Excel Data</h3>
            <FileUpload onUploadSuccess={fetchPoints} />
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>All Distribution Points ({points.length})</h3>
            {loading ? (
              <p>Loading...</p>
            ) : points.length === 0 ? (
              <p style={{ color: '#666' }}>No points loaded. Upload an Excel file to get started.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Latitude</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Longitude</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Address</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((point) => (
                      <tr key={point._id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{point.name}</td>
                        <td style={{ padding: '12px' }}>
                          {point.equipmentType ? (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              background: point.equipmentType === 'POP' ? '#e91e63' : '#ff9800',
                              color: 'white'
                            }}>
                              {point.equipmentType}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '12px' }}>{point.latitude.toFixed(6)}</td>
                        <td style={{ padding: '12px' }}>{point.longitude.toFixed(6)}</td>
                        <td style={{ padding: '12px' }}>{point.address || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button onClick={() => deletePoint(point._id)} style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
