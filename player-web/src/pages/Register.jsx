import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { api } from '../api';

const POSITIONS = ['Goalkeeper', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LW', 'RW', 'CF', 'ST'];
const AGE_CATEGORIES = ['U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];
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

const UserIcon = () => (
  <span className="input-icon">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </span>
);

const MailIcon = () => (
  <span className="input-icon">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  </span>
);

const PhoneIcon = () => (
  <span className="input-icon">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  </span>
);

const CalendarIcon = () => (
  <span className="input-icon">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  </span>
);

const TagIcon = () => (
  <span className="input-icon">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  </span>
);

const GalleryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function Register() {
  const currentYear = new Date().getFullYear();
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ageCategory: '',
    joiningYear: '',
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
      await api.post('/players/register', {
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
      <div className="auth-page">
        <div className="container auth-container">
          <div className="glass-card success-container">
            <div className="success-icon">✓</div>
            <h1 className="logo-text" style={{ fontSize: '2rem', marginBottom: '16px' }}>Registration Complete</h1>
            <p className="subheading" style={{ fontSize: '1.05rem', marginBottom: '30px', lineHeight: 1.6 }}>
              Your registration has been submitted! Await admin approval.
            </p>
            <button className="btn-primary btn-shine" onClick={() => {
              setIsSuccess(false);
              setFormData({ fullName: '', email: '', phone: '', dateOfBirth: '', ageCategory: '', joiningYear: '', positions: [], profilePhoto: '' });
            }}>Register Another Player</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="container auth-container">
        <header className="auth-header">
          <div className="auth-badge">
            <img src={logo} alt="BIFA Club Logo" />
          </div>
          <h1 className="logo-text">BIFA</h1>
          <p className="subheading">Official Player Registration</p>
          <span className="auth-pill">Season {currentYear}</span>
        </header>

        <div className="glass-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2 className="section-title">Personal Details</h2>

              <div className="form-group">
                <label className="form-label" htmlFor="fullName">Full Name</label>
                <div className="input-icon-wrap">
                  <UserIcon />
                  <input
                    id="fullName"
                    type="text"
                    className="form-input"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address (optional)</label>
                <div className="input-icon-wrap">
                  <MailIcon />
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <div className="input-icon-wrap">
                  <PhoneIcon />
                  <input
                    id="phone"
                    type="tel"
                    className="form-input"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dateOfBirth">Date of Birth</label>
                <div className="input-icon-wrap">
                  <CalendarIcon />
                  <input
                    id="dateOfBirth"
                    type="date"
                    className="form-input"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ageCategory">Age Category</label>
                <div className="input-icon-wrap">
                  <TagIcon />
                  <input
                    id="ageCategory"
                    type="text"
                    className="form-input form-input-readonly"
                    name="ageCategory"
                    value={formData.ageCategory}
                    readOnly
                  />
                </div>
                <small className="field-hint">
                  Automatically calculated from date of birth
                </small>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="joiningYear">Joining Year</label>
                <div className="input-icon-wrap">
                  <CalendarIcon />
                  <input
                    id="joiningYear"
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
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Playing Profile</h2>

              <div className="form-group">
                <label className="form-label">Profile Photo</label>
                <input
                  ref={galleryInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  required
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                />
                <div className="photo-grid">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <GalleryIcon />
                    Choose Photo
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <CameraIcon />
                    Open Camera
                  </button>
                </div>
                {isPhotoProcessing && (
                  <small className="field-hint">Optimizing photo...</small>
                )}
                {formData.profilePhoto && (
                  <div className="photo-preview">
                    <img src={formData.profilePhoto} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="position-label-wrap">
                  <label className="form-label">Positions</label>
                  <span className="position-counter">{formData.positions.length}/3</span>
                </div>
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
            </div>

            {error && (
              <div className="error-banner" role="alert">
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary btn-shine" disabled={isSubmitting || isPhotoProcessing}>
              {isSubmitting && <span className="btn-spinner" />}
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>
        </div>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
