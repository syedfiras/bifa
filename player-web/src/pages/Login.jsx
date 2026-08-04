import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { api, setToken } from '../api';

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
    <div className="container">
      <div className="header">
        <img src={logo} alt="BIFA Club Logo" style={{ width: '130px', height: '130px', borderRadius: '25px', border: '3px solid var(--bifa-yellow)', marginBottom: '15px' }} />
        <h1 className="logo-text" style={{ fontSize: '2rem', marginTop: '0', marginBottom: '10px' }}>BIFA</h1>
        <p className="subheading">Player Portal Login</p>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Access Pass</label>
            <input
              type="text"
              className="form-input"
              name="accessPass"
              placeholder="Enter your access pass (e.g. BIFA-XXXX)"
              value={formData.accessPass}
              onChange={handleChange}
              autoCapitalize="characters"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrap">
              <input
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
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <div className="error-text" style={{ marginBottom: '20px' }}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>

          <p className="subheading" style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.95rem' }}>
            New player? <Link to="/" style={{ color: 'var(--bifa-yellow)' }}>Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}