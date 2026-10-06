import React from 'react';

export default function Sidebar({ activePage, setActivePage, isOpen }) {
  const navItems = [
    { id: 'dashboard', icon: '▦', label: 'Dashboard' },
    { id: 'schedules', icon: '◷', label: 'Schedules' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="brand">
        <div className="brand-logo" style={{ background: 'rgba(99, 91, 255, 0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>UT</div>
        <div>
          <h1 style={{ fontSize: '15px' }}>Uni Timetable</h1>
          <p>Scheduler Engine</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <span className="status-dot"></span>
          Java engine ready
        </div>
      </div>
    </aside>
  );
}
