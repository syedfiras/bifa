import React, { useEffect, useState } from 'react';
import { api } from '../../api';

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, rate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/me')
      .then(res => {
        setRecords(res.data.data || []);
        setSummary(res.data.summary || { total: 0, present: 0, absent: 0, rate: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section>
        <h2 className="page-title">My Attendance</h2>
        <p className="page-subtitle">Your daily practice attendance record</p>
        <div className="stat-grid stat-grid--3">
          <div className="stat-card">
            <span className="stat-card-icon"><CalendarIcon /></span>
            <span className="stat-card-value">{summary.total}</span>
            <span className="stat-card-label">Sessions</span>
          </div>
          <div className="stat-card stat-card--green">
            <span className="stat-card-icon"><CheckIcon /></span>
            <span className="stat-card-value">{summary.present}</span>
            <span className="stat-card-label">Attended</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value">{summary.rate}%</span>
            <span className="stat-card-label">Attendance Rate</span>
          </div>
        </div>
      </section>

      <section className="glass-card">
        <h2 className="page-title" style={{ marginBottom: '18px' }}>Practice History</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div className="spinner" />
          </div>
        ) : records.length === 0 ? (
          <p className="field-hint">No attendance records yet. Your coach will mark your practice attendance.</p>
        ) : (
          <div className="attendance-list">
            {records.map(record => (
              <div key={record.id} className="attendance-row">
                <span className={`attendance-badge ${record.status === 'present' ? 'attendance-badge--present' : 'attendance-badge--absent'}`}>
                  {record.status === 'present' ? <CheckIcon /> : <XIcon />}
                </span>
                <span className="attendance-date">{formatDate(record.practiceDate)}</span>
                <span className={`attendance-status ${record.status === 'present' ? 'attendance-status--present' : 'attendance-status--absent'}`}>
                  {record.status === 'present' ? 'Present' : 'Absent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
