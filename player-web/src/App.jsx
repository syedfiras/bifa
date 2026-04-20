import React, { useState } from 'react';
import axios from 'axios';
import logo from './assets/logo.png';
import './index.css';

const POSITIONS = ['Goalkeeper', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LW', 'RW', 'CF', 'ST'];
const AGE_CATEGORIES = ['U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];
const API_URL = 'http://localhost:5000/api';

function App() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ageCategory: 'U20',
    positions: [],
    profilePhoto: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePosition = (pos) => {
    setFormData(prev => {
      const isSelected = prev.positions.includes(pos);
      if (isSelected) {
        return { ...prev, positions: prev.positions.filter(p => p !== pos) };
      } else {
        if (prev.positions.length >= 3) return prev; // max 3
        return { ...prev, positions: [...prev.positions, pos] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.positions.length === 0) {
      setError('Please select at least 1 position.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/players/register`, formData);
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container">
        <div className="glass-card success-container">
          <div className="success-icon">✓</div>
          <h1 className="logo-text" style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Registration Complete</h1>
          <p className="subheading" style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
            Your registration has been submitted! Await admin approval.
          </p>
          <button className="btn-primary" onClick={() => {
            setIsSuccess(false);
            setFormData({ fullName: '', email: '', phone: '', dateOfBirth: '', ageCategory: 'U20', positions: [], profilePhoto: '' });
          }}>Register Another Player</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <img src={logo} alt="BIFA Club Logo" style={{ width: '130px', height: '130px', borderRadius: '25px', border: '3px solid var(--bifa-yellow)', marginBottom: '15px' }} />
        <h1 className="logo-text" style={{ fontSize: '2rem', marginTop: '0', marginBottom: '10px' }}>BIFA</h1>
        <p className="subheading">Official Player Registration Portal</p>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              className="form-input"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Age Category</label>
            <select
              className="form-input"
              name="ageCategory"
              value={formData.ageCategory}
              onChange={handleInputChange}
              required
            >
              {AGE_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Profile Photo</label>
            <input
              type="file"
              className="form-input"
              accept="image/*"
              onChange={handlePhotoUpload}
              required
            />
            {formData.profilePhoto && (
              <div style={{ marginTop: '10px' }}>
                <img src={formData.profilePhoto} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bifa-yellow)' }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Positions (Max 3) - Selected: {formData.positions.length}/3
            </label>
            <div className="position-grid">
              {POSITIONS.map(pos => {
                const isSelected = formData.positions.includes(pos);
                const isDisabled = !isSelected && formData.positions.length >= 3;
                return (
                  <div
                    key={pos}
                    className={`position-chip ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => { if (!isDisabled) togglePosition(pos) }}
                  >
                    {pos}
                  </div>
                )
              })}
            </div>
          </div>

          {error && <div className="error-text" style={{ marginBottom: '20px' }}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
