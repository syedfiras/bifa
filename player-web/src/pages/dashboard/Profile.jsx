import React from 'react';
import { usePlayer } from './PlayerContext';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function Profile() {
  const player = usePlayer();

  const details = [
    { label: 'Full Name', value: player.fullName || '—' },
    { label: 'Access Pass', value: player.accessPass || '—' },
    { label: 'Email', value: player.email || '—' },
    { label: 'Phone', value: player.phone || '—' },
    { label: 'Date of Birth', value: formatDate(player.dateOfBirth) },
    { label: 'Age Category', value: player.ageCategory || '—' },
    { label: 'Joining Year', value: String(player.joiningYear || '—') },
    { label: 'Registered', value: formatDate(player.registrationDate) },
    { label: 'Positions', value: (player.positions || []).join(', ') || '—' },
    { label: 'Status', value: String(player.status || '—').toUpperCase() },
  ];

  return (
    <>
      <section>
        <h2 className="page-title">Player Profile</h2>
        <p className="page-subtitle">Your registered details with BIFA Football Club</p>
        <div className="glass-card">
          <div className="profile-grid">
            {details.map(item => (
              <div key={item.label} className="profile-item">
                <span className="profile-item-label">{item.label}</span>
                <span className="profile-item-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="page-title">Club ID Card</h2>
        <p className="page-subtitle">Present this at the club gate along with your access pass</p>
        <div className="glass-card" style={{ padding: '24px', backgroundColor: 'transparent', background: 'transparent', border: 'none', boxShadow: 'none' }}>
          <div className="id-card">
            <div className="id-card-header">
              <div className="id-card-photo">
                {player.profilePhoto ? (
                  <img src={player.profilePhoto} alt={player.fullName} />
                ) : (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="var(--bifa-yellow)">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
              <div className="id-card-info">
                <span className="id-card-name">{player.fullName}</span>
                <span className="id-card-pos">{(player.positions || []).join(' · ')}</span>
                <span className="id-card-category">{player.ageCategory || 'U20'}</span>
                <span className="id-card-passlabel">Valid ID Card</span>
              </div>
            </div>

            <div className="id-card-body">
              {[
                { label: 'Email', value: player.email || 'N/A' },
                { label: 'Phone', value: player.phone || 'N/A' },
                { label: 'Date of Birth', value: formatDate(player.dateOfBirth) },
                { label: 'Registration', value: formatDate(player.registrationDate) },
              ].map(row => (
                <div key={row.label} className="id-row">
                  <span className="id-row-label">{row.label}</span>
                  <span className="id-row-value">{row.value}</span>
                </div>
              ))}
              <div className="id-row">
                <span className="id-row-label">Status</span>
                <span className="id-row-value" style={{ color: player.status === 'accepted' ? '#4ade80' : '#fbbf24', fontWeight: 900 }}>
                  {String(player.status || 'unknown').toUpperCase()}
                </span>
              </div>
              {player.accessPass && (
                <div className="id-access-pass">
                  <span className="id-row-label" style={{ border: 'none', padding: 0 }}>Access Pass</span>
                  <span className="access-pass-value">{player.accessPass}</span>
                </div>
              )}
            </div>

            <div className="id-signature">
              <div className="id-signature-line" />
              <span className="id-signature-label">BIFA Secretary</span>
            </div>

            <div className="id-card-footer">
              <span className="id-card-brand">BIFA</span>
              <div>
                <div className="id-card-footer-text">Player Identification</div>
                <div className="id-card-footer-sub">Valid ID Card</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}