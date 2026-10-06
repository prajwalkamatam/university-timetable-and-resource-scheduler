import React, { useState, useEffect } from 'react';

const BADGE_COLORS = ['purple', 'blue', 'green', 'orange', 'purple', 'blue', 'green', 'orange'];

export default function SchedulesPage({ showToast }) {
  const [schedules, setSchedules] = useState([]);
  const [search,    setSearch]    = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const savedStr = localStorage.getItem('archivedSchedules');
    if (savedStr) {
      setSchedules(JSON.parse(savedStr));
    }
  }, []);

  const filtered = schedules.filter((s) => {
    return s.title.toLowerCase().includes(search.toLowerCase());
  });

  function handleDelete(id) {
    const updated = schedules.filter((s) => s.id !== id);
    setSchedules(updated);
    localStorage.setItem('archivedSchedules', JSON.stringify(updated));
    showToast('Schedule deleted.', 'info');
  }

  function handleDownload(s) {
    const rows = [['Cohort', 'Course', 'Professor', 'Room', 'Timeslot', 'Day']];
    Object.keys(s.data).forEach(cohort => {
      s.data[cohort].forEach(c => {
        rows.push([cohort, c.course, c.professor, c.room, c.ts, c.day]);
      });
    });
    
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `archive_${s.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded archive export`, 'success');
  }

  return (
    <div className="schedules-page">
      {/* Header */}
      <div className="schedules-header">
        <div>
          <p className="section-label">History &amp; Archive</p>
          <h3 style={{ margin: '0 0 5px', fontSize: 18, fontWeight: 750 }}>Saved Schedules</h3>
          <p className="section-description">
            Browse, download, or delete previously generated schedules.
          </p>
        </div>
        <span
          style={{
            padding: '6px 12px',
            borderRadius: 20,
            background: 'var(--primary-soft)',
            color: 'var(--primary)',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {schedules.length} total
        </span>
      </div>

      {/* Search + Filter */}
      <div className="schedule-search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {search && (
          <button
            className="secondary-button"
            style={{ height: 42 }}
            onClick={() => setSearch('')}
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {schedules.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📭</span>
          <p>No saved schedules yet. Generate a schedule to see it archived here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📭</span>
          <p>No schedules found matching your filters.</p>
        </div>
      ) : (
        <div className="schedules-grid">
          {filtered.map((s, idx) => {
            const numClasses = Object.values(s.data).reduce((acc, curr) => acc + curr.length, 0);
            return (
              <div key={s.id} className="schedule-card-item">
                <div className="schedule-card-top">
                  <span className={`schedule-cohort-badge ${BADGE_COLORS[idx % BADGE_COLORS.length]}`}>
                    ▦ {s.cohorts} {s.cohorts === 1 ? 'Cohort' : 'Cohorts'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {s.id}</span>
                </div>

                <h4 style={{ lineHeight: '1.4' }}>{s.title}</h4>
                <p>Saved on {s.date}</p>

                <div className="schedule-card-stats">
                  <div className="stat">
                    <span className="stat-label">Total Classes</span>
                    <span className="stat-value">{numClasses}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Conflicts</span>
                    <span className="stat-value" style={{ color: 'var(--success)' }}>0</span>
                  </div>
                </div>

                <div className="schedule-card-actions">
                  <button
                    className="outline-button"
                    style={{ flex: 1, height: 34, fontSize: 11 }}
                    onClick={() => handleDownload(s)}
                  >
                    ↓ Export Data
                  </button>
                  <button
                    className="danger-button"
                    style={{ height: 34, fontSize: 11, padding: '0 12px' }}
                    onClick={() => handleDelete(s.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
