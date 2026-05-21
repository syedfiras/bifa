import React, { useState } from 'react';
import axios from 'axios';
import logo from './assets/logo.png';
import './index.css';

const POSITIONS = ['Goalkeeper', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LW', 'RW', 'CF', 'ST'];
const AGE_CATEGORIES = ['U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const MAX_PHOTO_SIZE = 500;
const PHOTO_QUALITY = 0.6;

const resizePhoto = (file) => new Promise((resolve, reject) => {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    const scale = Math.min(MAX_PHOTO_SIZE / image.width, MAX_PHOTO_SIZE / image.height, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(imageUrl);

    resolve(canvas.toDataURL('image/jpeg', PHOTO_QUALITY));
  };

  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    reject(new Error('Could not process image. Please choose another photo.'));
  };

  image.src = imageUrl;
});

function App() {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ageCategory: '',
    joiningYear: '', // Changed from currentYear.toString() to empty string
    positions: [],
    profilePhoto: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Calculate age category from date of birth
  const calculateAgeCategory = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year yet
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Determine age category based on age
    if (age < 13) return 'U13';
    if (age < 15) return 'U15';
    if (age < 17) return 'U17';
    if (age < 19) return 'U19';
    if (age < 20) return 'U20';
    return 'SENIOR';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If date of birth changes, auto-calculate age category
    if (name === 'dateOfBirth') {
      const ageCategory = calculateAgeCategory(value);
      setFormData(prev => ({ ...prev, [name]: value, ageCategory }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      e.target.value = '';
      return;
    }

    setError('');
    setIsPhotoProcessing(true);
    try {
      const compressedPhoto = await resizePhoto(file);
      setFormData(prev => ({ ...prev, profilePhoto: compressedPhoto }));
    } catch (err) {
      setError(err.message);
      setFormData(prev => ({ ...prev, profilePhoto: '' }));
      e.target.value = '';
    } finally {
      setIsPhotoProcessing(false);
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

    if (!formData.joiningYear) {
      setError('Please enter a joining year.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/players/register`, {
        ...formData,
        joiningYear: Number(formData.joiningYear)
      });
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
            setFormData({ fullName: '', email: '', phone: '', dateOfBirth: '', ageCategory: '', joiningYear: '', positions: [], profilePhoto: '' });
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
            <label className="form-label">Email Address (optional)</label>
            <input
              type="email"
              className="form-input"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleInputChange}
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
            <input
              type="text"
              className="form-input"
              name="ageCategory"
              value={formData.ageCategory}
              readOnly
              style={{ 
                backgroundColor: '#f0f0f0', 
                color: '#555',
                cursor: 'not-allowed'
              }}
            />
            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
              Automatically calculated from date of birth
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Joining Year</label>
            <input
              type="number"
              className="form-input"
              name="joiningYear"
              placeholder="Enter joining year"
              value={formData.joiningYear}
              onChange={handleInputChange}
              min="1900"
              max={currentYear}
              required
            />
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
            {isPhotoProcessing && (
              <small style={{ display: 'block', marginTop: '8px', color: '#a1a1aa' }}>
                Optimizing photo...
              </small>
            )}
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

          <button type="submit" className="btn-primary" disabled={isSubmitting || isPhotoProcessing}>
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
