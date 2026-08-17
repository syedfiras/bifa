import React from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from './PlayerContext';

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const TargetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const ZapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IdCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <circle cx="8" cy="12" r="2" />
    <path d="M5 16c.5-1.5 1.7-2.2 3-2.2s2.5.7 3 2.2" />
    <line x1="14" y1="10" x2="19" y2="10" />
    <line x1="14" y1="14" x2="19" y2="14" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 21v-7" />
    <path d="M4 10V3" />
    <path d="M12 21v-9" />
    <path d="M12 8V3" />
    <path d="M20 21v-5" />
    <path d="M20 12V3" />
    <path d="M1 14h6" />
    <path d="M9 8h6" />
    <path d="M17 16h6" />
  </svg>
);

export default function Overview() {
  const player = usePlayer();

  const isGK = (player.positions || []).includes('Goalkeeper');
  const isDefender = (player.positions || []).some(pos => ['CB', 'LB', 'RB'].includes(pos));

  const stats = isGK
    ? [
        { label: 'Matches', value: player.matchesPlayed ?? 0, icon: ActivityIcon },
        { label: 'Goals Conceded', value: player.goalsConceded ?? 0, icon: ShieldIcon },
        { label: 'Clean Sheets', value: player.cleanSheets ?? 0, icon: TargetIcon },
      ]
    : isDefender
      ? [
          { label: 'Matches', value: player.matchesPlayed ?? 0, icon: ActivityIcon },
          { label: 'Goals', value: player.goals ?? 0, icon: TargetIcon },
          { label: 'Assists', value: player.assists ?? 0, icon: ZapIcon },
          { label: 'Goals Conceded', value: player.goalsConceded ?? 0, icon: ShieldIcon },
        ]
      : [
          { label: 'Matches', value: player.matchesPlayed ?? 0, icon: ActivityIcon },
          { label: 'Goals', value: player.goals ?? 0, icon: TargetIcon },
          { label: 'Assists', value: player.assists ?? 0, icon: ZapIcon },
        ];

  const quickLinks = [
    { to: '/dashboard/stats', title: 'Season Stats', desc: 'View your performance analytics', icon: ChartIcon },
    { to: '/dashboard/profile', title: 'Profile & ID Card', desc: 'Your details and club ID', icon: IdCardIcon },
    { to: '/dashboard/settings', title: 'Account Settings', desc: 'Manage your password', icon: SettingsIcon },
  ];

  const statusClass = ['accepted', 'pending', 'declined'].includes(player.status) ? player.status : 'pending';

  return (
    <>
      <section className="glass-card dash-hero">
        <div className="dash-hero-top">
          {player.profilePhoto ? (
            <img className="avatar" src={player.profilePhoto} alt="Profile" />
          ) : (
            <div className="avatar avatar-placeholder">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--bifa-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <div className="dash-hero-text">
            <h1 className="dash-hero-name">Welcome back, {player.fullName?.split(' ')[0]}</h1>
            <p className="dash-hero-pos">{(player.positions || []).join(' · ')}</p>
            <div className="dash-pill-row">
              <span className={`status-pill ${statusClass}`}>{player.status}</span>
              <span className="auth-pill" style={{ marginTop: 0 }}>{player.ageCategory || 'U20'}</span>
            </div>
          </div>
        </div>

        <div className="access-pass">
          <span className="access-pass-label">Access Pass</span>
          <span className="access-pass-value">{player.accessPass || '—'}</span>
        </div>
      </section>

      <section>
        <h2 className="page-title">Season Overview</h2>
        <p className="page-subtitle">Your career numbers at a glance</p>
        <div className={`stat-grid ${isDefender ? 'stat-grid--4' : ''}`}>
          {stats.map(stat => (
            <div key={stat.label} className="stat-card">
              <span className="stat-card-icon"><stat.icon /></span>
              <span className="stat-card-value">{stat.value}</span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="page-title">Quick Access</h2>
        <p className="page-subtitle">Jump to any part of your portal</p>
        <div className="quick-grid">
          {quickLinks.map(link => (
            <Link key={link.to} to={link.to} className="quick-card">
              <span className="quick-card-icon"><link.icon /></span>
              <span className="quick-card-title">{link.title}</span>
              <span className="quick-card-desc">{link.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}