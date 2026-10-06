import React, { useState, useRef, useEffect } from 'react';

const PAGE_TITLES = {
  dashboard: { eyebrow: 'Academic Scheduling', title: 'University Time Table Scheduler' },
  schedules: { eyebrow: 'History & Archive',   title: 'Saved Schedules' },
  settings:  { eyebrow: 'Configuration',       title: 'Settings' },
};

const NOTIFICATIONS = [
  { id: 1, text: 'Schedule for CSE-1 generated successfully.', time: '2 min ago',  unread: true  },
  { id: 2, text: 'Week 3 schedule exported as CSV.',          time: '15 min ago', unread: true  },
  { id: 3, text: 'New room "Tesla Lab" added to the list.',   time: '1 hr ago',   unread: false },
];

export default function Topbar({ activePage }) {
  const [showNotif, setShowNotif]   = useState(false);
  const [notifs,    setNotifs]      = useState(NOTIFICATIONS);
  const dropdownRef                 = useRef(null);

  const unreadCount = notifs.filter((n) => n.unread).length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  const { eyebrow, title } = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>

      <div className="topbar-actions" ref={dropdownRef}>
        {/* Notification Bell */}
        <button
          className="icon-button"
          aria-label="Notifications"
          onClick={() => setShowNotif((v) => !v)}
        >
          🔔
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount}</span>
          )}
        </button>

        {showNotif && (
          <div className="notif-dropdown">
            <div className="notif-dropdown-header">
              <h4>Notifications</h4>
              <button className="notif-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            </div>

            {notifs.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${n.unread ? 'unread' : ''}`}
                onClick={() => {
                  setNotifs((prev) =>
                    prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
                  );
                }}
              >
                {n.unread && <span className="notif-dot"></span>}
                <div className="notif-item-content">
                  <p>{n.text}</p>
                  <span>{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Profile */}
        <div className="user-profile">
          <div className="avatar">AD</div>
          <div className="user-info">
            <strong>Admin User</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
