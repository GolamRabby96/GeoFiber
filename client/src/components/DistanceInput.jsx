import React, { useState, useEffect, useRef } from 'react';

function DistanceInput({ onCalculate, loading }) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [points, setPoints] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      const response = await fetch('/api/upload/points');
      const data = await response.json();
      setPoints(data);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length > 2) {
      const filtered = points.filter(point =>
        point.name.toLowerCase().includes(value.toLowerCase()) ||
        point.address?.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (point) => {
    setInputValue(`${point.latitude}, ${point.longitude}`);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parts = inputValue.split(',').map(s => s.trim());

    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);

      if (!isNaN(lat) && !isNaN(lng)) {
        onCalculate(lat, lng);
      } else {
        alert('Please enter valid coordinates (e.g., 23.8103, 90.4125)');
      }
    } else {
      alert('Please enter coordinates in format: latitude, longitude');
    }
  };

  return (
    <div style={{
      marginTop: '20px',
      padding: '15px',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      <h3 style={{ marginTop: 0, color: '#333' }}>Calculate Distance</h3>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        Enter latitude and longitude (e.g., 23.8103, 90.4125) or search by name
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="lat, lng (e.g., 23.8103, 90.4125)"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />

          {showSuggestions && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '6px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {suggestions.map((point, index) => (
                <div
                  key={point._id}
                  onClick={() => handleSuggestionClick(point)}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none',
                    fontSize: '13px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  <strong>{point.name}</strong>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !inputValue}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '12px',
            background: loading || !inputValue ? '#ccc' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading || !inputValue ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Calculating...' : 'Calculate Distance'}
        </button>
      </form>
    </div>
  );
}

export default DistanceInput;
