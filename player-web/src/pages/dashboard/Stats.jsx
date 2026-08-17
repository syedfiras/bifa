import React from 'react';
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

const TrophyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function Stats() {
  const player = usePlayer();

  const matches = player.matchesPlayed ?? 0;
  const goals = player.goals ?? 0;
  const assists = player.assists ?? 0;
  const involvement = goals + assists;

  const goalsPerMatch = matches > 0 ? goals / matches : 0;
  const assistsPerMatch = matches > 0 ? assists / matches : 0;
  const involvementPerMatch = matches > 0 ? involvement / matches : 0;

  const goalRate = matches > 0 ? Math.min((goals / matches) * 100, 100) : 0;
  const assistRate = matches > 0 ? Math.min((assists / matches) * 100, 100) : 0;
  const involvementRate = matches > 0 ? Math.min((involvement / matches) * 100, 100) : 0;

  const totals = [
    { label: 'Matches', value: matches, icon: ActivityIcon },
    { label: 'Goals', value: goals, icon: TargetIcon },
    { label: 'Assists', value: assists, icon: ZapIcon },
    { label: 'Goal Involvement', value: involvement, icon: TrophyIcon },
  ];

  const isGK = (player.positions || []).includes('Goalkeeper');
  const isDefender = (player.positions || []).some(pos => ['CB', 'LB', 'RB'].includes(pos));
  const defensiveTotals = isGK
    ? [
        { label: 'Matches', value: matches, icon: ActivityIcon },
        { label: 'Goals Conceded', value: player.goalsConceded ?? 0, icon: ShieldIcon },
        { label: 'Clean Sheets', value: player.cleanSheets ?? 0, icon: TrophyIcon },
      ]
    : [
        { label: 'Matches', value: matches, icon: ActivityIcon },
        { label: 'Goals', value: goals, icon: TargetIcon },
        { label: 'Assists', value: assists, icon: ZapIcon },
        { label: 'Goals Conceded', value: player.goalsConceded ?? 0, icon: ShieldIcon },
      ];

  const bars = [
    { label: 'Goals per match', value: goalsPerMatch.toFixed(2), percent: goalRate },
    { label: 'Assists per match', value: assistsPerMatch.toFixed(2), percent: assistRate },
    { label: 'Involvement per match', value: involvementPerMatch.toFixed(2), percent: involvementRate },
  ];

  const seasonInfo = [
    { label: 'Age Category', value: player.ageCategory || '—' },
    { label: 'Joining Year', value: String(player.joiningYear || '—') },
    { label: 'Registered', value: formatDate(player.registrationDate) },
    { label: 'Positions', value: (player.positions || []).join(', ') || '—' },
  ];

  return (
    <>
      <section>
        <h2 className="page-title">Season Stats</h2>
        <p className="page-subtitle">Your performance analytics for BIFA {player.joiningYear || ''}</p>
        <div className="stat-grid stat-grid--4">
          {(isGK || isDefender ? defensiveTotals : totals).map(stat => (
            <div key={stat.label} className="stat-card">
              <span className="stat-card-icon"><stat.icon /></span>
              <span className="stat-card-value">{stat.value}</span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {(isGK || isDefender) && matches > 0 && (
        <section className="glass-card">
          <h2 className="page-title" style={{ marginBottom: '18px' }}>Defensive Averages</h2>
          {(() => {
            const concededPerMatch = (player.goalsConceded ?? 0) / matches;
            const cleanSheetRate = isGK ? Math.min(((player.cleanSheets ?? 0) / matches) * 100, 100) : null;
            return (
              <>
                <div className="bar-row">
                  <div className="bar-top">
                    <span className="bar-label">Goals conceded per match</span>
                    <span className="bar-value">{concededPerMatch.toFixed(2)}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.min(concededPerMatch * 100, 100)}%` }} />
                  </div>
                </div>
                {cleanSheetRate !== null && (
                  <>
                    <div className="bar-row">
                      <div className="bar-top">
                        <span className="bar-label">Clean sheet rate</span>
                        <span className="bar-value">{cleanSheetRate.toFixed(0)}%</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${cleanSheetRate}%` }} />
                      </div>
                    </div>
                    <p className="field-hint">
                      Clean sheet rate is capped at 100% and scales with the matches you have played.
                    </p>
                  </>
                )}
              </>
            );
          })()}
        </section>
      )}

      <section className="glass-card">
        <h2 className="page-title" style={{ marginBottom: '18px' }}>Per Match Averages</h2>
        {bars.map(bar => (
          <div key={bar.label} className="bar-row">
            <div className="bar-top">
              <span className="bar-label">{bar.label}</span>
              <span className="bar-value">{bar.value}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${bar.percent}%` }} />
            </div>
          </div>
        ))}
        <p className="field-hint">
          Rates are capped at 100% and scale with the matches you have played.
        </p>
      </section>

      <section className="glass-card">
        <h2 className="page-title" style={{ marginBottom: '18px' }}>Season Profile</h2>
        <div className="profile-grid">
          {seasonInfo.map(item => (
            <div key={item.label} className="profile-item">
              <span className="profile-item-label">{item.label}</span>
              <span className="profile-item-value">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}