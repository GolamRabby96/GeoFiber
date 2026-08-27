import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = '/api';

function FileUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const [uploadResult, setUploadResult] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setMessage({ type: 'error', text: 'Please upload an Excel file (.xlsx or .xls)' });
      return;
    }

    setUploading(true);
    setMessage('');
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const resultText = `Uploaded ${response.data.inserted} points successfully${response.data.skipped > 0 ? ` (${response.data.skipped} skipped)` : ''}`;
      setMessage({
        type: response.data.inserted > 0 ? 'success' : 'error',
        text: resultText
      });
      setUploadResult(response.data);
      onUploadSuccess();
      try {
        const pointsRes = await fetch('/api/upload/points');
        const points = await pointsRes.json();
        localStorage.setItem('distributionPoints', JSON.stringify(points));
      } catch (e) {
        console.error('Failed to cache points:', e);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Upload failed'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDebug = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload/debug`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadResult(response.data);
      setMessage({ type: 'info', text: `Debug: ${response.data.totalRows} rows, lat col: ${response.data.matchedLatColumn}, lng col: ${response.data.matchedLngColumn}` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Debug failed' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearAllPoints = async () => {
    if (!window.confirm('Are you sure you want to delete all points?')) return;

    try {
      await axios.delete(`${API_URL}/upload/points`);
      localStorage.removeItem('distributionPoints');
      setMessage({ type: 'success', text: 'All points deleted' });
      onUploadSuccess();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete points' });
    }
  };

  return (
    <div style={{ padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0, color: '#333' }}>Upload Excel Data</h3>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
        Supports: Name/lat/lng, Point Name/Latitude/Longitude, and many variants. Use Debug first if upload fails.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id="file-upload"
      />

      <label htmlFor="file-upload" style={{
        display: 'block',
        padding: '12px',
        background: uploading ? '#ccc' : '#1a237e',
        color: 'white',
        textAlign: 'center',
        borderRadius: '6px',
        cursor: uploading ? 'not-allowed' : 'pointer',
        marginBottom: '10px',
        fontSize: '14px'
      }}>
        {uploading ? 'Uploading...' : 'Choose Excel File & Upload'}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleDebug}
        style={{ display: 'none' }}
        id="file-debug"
      />

      <label htmlFor="file-debug" style={{
        display: 'block',
        padding: '8px',
        background: '#607d8b',
        color: 'white',
        textAlign: 'center',
        borderRadius: '6px',
        cursor: 'pointer',
        marginBottom: '10px',
        fontSize: '12px'
      }}>
        Debug: Check Excel Columns
      </label>

      {message && (
        <div style={{
          padding: '10px',
          borderRadius: '4px',
          background: message.type === 'error' ? '#ffebee' : message.type === 'info' ? '#e3f2fd' : '#e8f5e9',
          color: message.type === 'error' ? '#c62828' : message.type === 'info' ? '#0d47a1' : '#2e7d32',
          fontSize: '14px',
          marginBottom: '10px'
        }}>
          {message.text}
        </div>
      )}

      {uploadResult && uploadResult.detectedColumns && (
        <div style={{
          padding: '10px',
          borderRadius: '4px',
          background: '#e3f2fd',
          color: '#0d47a1',
          fontSize: '12px',
          marginBottom: '10px'
        }}>
          <strong>Detected columns:</strong> {uploadResult.detectedColumns.join(', ')}<br/>
          <strong>Matched Lat:</strong> {uploadResult.matchedLatColumn || 'None'} | <strong>Lng:</strong> {uploadResult.matchedLngColumn || 'None'} | <strong>Equip:</strong> {uploadResult.matchedEquipColumn || 'None'}
        </div>
      )}

      {uploadResult && uploadResult.sampleErrors && uploadResult.sampleErrors.length > 0 && (
        <div style={{
          padding: '10px',
          borderRadius: '4px',
          background: '#fff3e0',
          color: '#e65100',
          fontSize: '12px',
          marginBottom: '10px',
          maxHeight: '150px',
          overflowY: 'auto'
        }}>
          <strong>Sample skipped rows:</strong>
          {uploadResult.sampleErrors.map((err, i) => (
            <div key={i} style={{ marginTop: '4px', fontSize: '11px' }}>{err}</div>
          ))}
        </div>
      )}

      {uploadResult && uploadResult.sampleRows && (
        <div style={{
          padding: '10px',
          borderRadius: '4px',
          background: '#f3e5f5',
          color: '#4a148c',
          fontSize: '11px',
          marginBottom: '10px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <strong>First rows preview:</strong>
          {uploadResult.sampleRows.map((row, i) => (
            <div key={i} style={{ marginTop: '4px' }}>{JSON.stringify(row)}</div>
          ))}
        </div>
      )}

      <button
        onClick={clearAllPoints}
        style={{
          width: '100%',
          padding: '8px',
          background: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Clear All Points
      </button>
    </div>
  );
}

export default FileUpload;
