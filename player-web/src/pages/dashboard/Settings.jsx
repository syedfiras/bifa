import React, { useState } from 'react';
import { api } from '../../api';

const KeyIcon = () => (
  <span className="input-icon">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  </span>
);

export default function Settings() {
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [isSavingPass, setIsSavingPass] = useState(false);

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

  return (
    <>
      <section>
        <h2 className="page-title">Account Settings</h2>
        <p className="page-subtitle">Keep your account secure by updating your password regularly</p>

        <div className="glass-card">
          <h3 className="section-title" style={{ marginBottom: '20px' }}>Change Password</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">Current Password</label>
              <div className="password-wrap">
                <input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input"
                  name="currentPassword"
                  placeholder="Enter your current password"
                  value={passForm.currentPassword}
                  onChange={handlePassChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrent(prev => !prev)}
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrent ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <div className="input-icon-wrap">
                <KeyIcon />
                <input
                  id="newPassword"
                  type="password"
                  className="form-input"
                  name="newPassword"
                  placeholder="Enter a new password (min 4 characters)"
                  value={passForm.newPassword}
                  onChange={handlePassChange}
                  required
                />
              </div>
              <small className="field-hint">
                Minimum 4 characters. Current password is required to confirm.
              </small>
            </div>

            {passError && <div className="error-text" style={{ marginBottom: '16px' }}>{passError}</div>}
            {passMsg && <div className="success-msg" style={{ marginBottom: '16px' }}>{passMsg}</div>}

            <button type="submit" className="btn-primary btn-shine" disabled={isSavingPass}>
              {isSavingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="glass-card">
          <h3 className="section-title" style={{ marginBottom: '14px' }}>Security Tips</h3>
          <ul className="tips-list">
            <li>Never share your access pass or password with anyone.</li>
            <li>Use a mix of letters, numbers, and symbols for your password.</li>
            <li>Contact the BIFA admin team if you suspect unauthorized access.</li>
          </ul>
        </div>
      </section>
    </>
  );
}