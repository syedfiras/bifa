import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { api, getToken, clearToken } from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [isSavingPass, setIsSavingPass] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate('/login');
      return;
    }
    api.get('/players/me')
      .then(res => setPlayer(res.data.data))
      .catch(() => {
        clearToken();
        navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPassForm(prev => ({ ...prev, [name]: value }));
    setPassMsg('');
    setPassError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassError('');
    setIsSavingPass(true);
    try {
      const res = await api.put('/players/password', passForm);
      setPassMsg(res.data.message || 'Password updated successfully');
      setPassForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSavingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div className="spinner" />
        <p className="subheading">Loading your profile...</p>
      </div>
    );
  }

  if (!player) return null;

  const stats = [
    { label: 'Matches', value: player.matchesPlayed ?? 0 },
    { label: 'Goals', value: player.goals ?? 0 },
    { label: 'Assists', value: player.assists ?? 0 },
  ];

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <img src={logo} alt="BIFA Club Logo" style={{ width: '60px', height: '60px', borderRadius: '15px', border: '2px solid var(--bifa-yellow)' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/" className="btn-secondary" style={{ width: 'auto', padding: '10px 20px', textDecoration: 'none', display: 'inline-block' }}>Register</Link>
          <button className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="header" style={{ marginBottom: '24px' }}>
        <h1 className="logo-text" style={{ fontSize: '1.8rem', marginTop: '0', marginBottom: '6px' }}>Player Dashboard</h1>
        <p className="subheading">Welcome back!</p>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          {player.profilePhoto ? (
            <img
              src={player.profilePhoto}
              alt="Profile"
              style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bifa-yellow)' }}
            />
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--bifa-light-gray)', border: '2px solid var(--bifa-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--bifa-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{player.fullName}</h2>
            <p className="subheading" style={{ fontSize: '0.95rem' }}>{(player.positions || []).join(', ')}</p>
          </div>
        </div>

        <div className="info-grid">
          <InfoItem label="Access Pass" value={player.accessPass || '—'} />
          <InfoItem label="Age Category" value={player.ageCategory || '—'} />
          <InfoItem label="Joining Year" value={String(player.joiningYear || '—')} />
          <InfoItem label="Phone" value={player.phone || '—'} />
          <InfoItem label="Email" value={player.email || '—'} />
          <InfoItem label="Status" value={(player.status || 'unknown').toUpperCase()} isStatus />
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--bifa-yellow)' }}>Season Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {stats.map(stat => (
            <div key={stat.label} className="stat-box">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--bifa-yellow)' }}>Change Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              name="currentPassword"
              placeholder="Enter your current password"
              value={passForm.currentPassword}
              onChange={handlePassChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              name="newPassword"
              placeholder="Enter a new password (min 4 characters)"
              value={passForm.newPassword}
              onChange={handlePassChange}
              required
            />
          </div>
          {passError && <div className="error-text" style={{ marginBottom: '16px' }}>{passError}</div>}
          {passMsg && <div className="success-msg" style={{ marginBottom: '16px' }}>{passMsg}</div>}
          <button type="submit" className="btn-primary" disabled={isSavingPass}>
            {isSavingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

const InfoItem = ({ label, value, isStatus }) => (
  <div className="info-item">
    <span className="info-label">{label}</span>
    <span className={`info-value ${isStatus ? 'status-value' : ''}`}>{value}</span>
  </div>
);