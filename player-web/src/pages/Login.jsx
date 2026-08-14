import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { api, setToken } from '../api';

const AccessPassIcon = () => (
  <span className="input-icon">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  </span>
);

const LockIcon = () => (
  <span className="input-icon">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  </span>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ accessPass: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await api.post('/players/login', formData);
      setToken(res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container auth-container">
        <header className="auth-header">
          <div className="auth-badge">
            <img src={logo} alt="BIFA Club Logo" />
          </div>
          <h1 className="logo-text">BIFA</h1>
          <p className="subheading">Player Portal Login</p>
          <span className="auth-pill">Player Access</span>
        </header>

        <div className="glass-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="accessPass">Access Pass</label>
              <div className="input-icon-wrap">
                <AccessPassIcon />
                <input
                  id="accessPass"
                  type="text"
                  className="form-input"
                  name="accessPass"
                  placeholder="e.g. BIFA-XXXX"
                  value={formData.accessPass}
                  onChange={handleChange}
                  autoCapitalize="characters"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-banner" role="alert">
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary btn-shine" disabled={isSubmitting}>
              {isSubmitting && <span className="btn-spinner" />}
              {isSubmitting ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>

        <p className="auth-switch">
          New player? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
