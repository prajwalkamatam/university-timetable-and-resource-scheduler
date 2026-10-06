import React, { useState, useCallback, useEffect } from 'react';
import { useSettings } from './store';
import { generateMockScheduleFromCSV } from './mockEngine';
import Sidebar from './components/Sidebar';
import ControlPanel from './components/ControlPanel';
import TimetableSection from './components/TimetableSection';
import SchedulesPage from './components/SchedulesPage';
import SettingsPage from './components/SettingsPage';
import { ConnectivityGraph } from '@designcodeio/threeui/components/ConnectivityGraph';
import './index.css';

/* ── Toast System ── */
let toastId = 0;

const TOAST_ICONS = { success: '✅', error: '❌', info: 'ℹ️' };

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{TOAST_ICONS[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [activePage,     setActivePage]     = useState('dashboard');
  const [isSidebarOpen,  setIsSidebarOpen]  = useState(true);
  const [theme,          setTheme]          = useState('light');
  const [lastGenerated,  setLastGenerated]  = useState(null);
  const [toasts,         setToasts]         = useState([]);
  const [scheduleMap,    setScheduleMap]    = useState({}); // Global schedule state

  const { settings, updateSettings, resetSettings } = useSettings();

  /* Apply theme to HTML root */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', settings.accentColor);
    if (settings.compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
  }, [settings.accentColor, settings.compactMode]);

  /* Show a toast for 3 seconds */
  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  function handleGenerate({ weekNumber, files, cohortName, courseOverrides }) {
    const now = new Date().toLocaleString(settings.language, {
      timeZone: settings.timezone,
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    setLastGenerated(now);
    
    // Process the uploaded CSV files locally and merge into the existing scheduleMap
    setScheduleMap((prevMap) => {
      let newScheduleMap = { ...prevMap };
      
      const cohortsToGen = cohortName ? [cohortName] : Array.from({length: settings.defaultCohorts}, (_, i) => `Auto-Cohort ${i+1}`);
      
      cohortsToGen.forEach(name => {
        newScheduleMap = generateMockScheduleFromCSV(files, name, newScheduleMap, { ...settings, courseOverrides });
      });
      
      // Auto-Backup to Archives
      if (settings.autoBackup) {
        const savedStr = localStorage.getItem('archivedSchedules');
        const archives = savedStr ? JSON.parse(savedStr) : [];
        const cohortKeys = Object.keys(newScheduleMap);
        archives.unshift({
          id: Date.now(),
          date: now,
          title: cohortKeys.length > 0 ? cohortKeys.join(' + ') : `Schedule Gen: Week ${weekNumber}`,
          cohortNames: cohortKeys,
          cohorts: cohortKeys.length,
          data: newScheduleMap
        });
        const keepCount = settings.backupCount === 'unlimited' ? 100 : (parseInt(settings.backupCount) || 5);
        localStorage.setItem('archivedSchedules', JSON.stringify(archives.slice(0, keepCount)));
      }
      
      return newScheduleMap;
    });
    
    if (settings.notifGenComplete) {
      showToast(`Cohort ${cohortName} added to schedule successfully!`, 'success');
    }
  }

  function handleReset() {
    showToast('Control panel reset.', 'info');
    setScheduleMap({});
    setLastGenerated(null);
  }

  return (
    <>
      {/* 1. ThreeUI WebGL Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, background: theme === 'dark' ? '#0a1220' : '#c4d9ef' }}>
        <ConnectivityGraph mode={theme} />
      </div>

      {/* 2. Main App Content */}
      <div className="app-shell" style={{ background: 'transparent' }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={isSidebarOpen} />

        <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{ background: 'transparent' }}>
          
          {/* Floating Header & Toggle */}
          <div className="floating-header">
            <button className="icon-button menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              ☰
            </button>
            <div className="page-title" style={{ flex: 1 }}>
              {activePage === 'dashboard' && (
                <><p className="eyebrow">Academic Scheduling</p><h2>University Time Table Scheduler</h2></>
              )}
              {activePage === 'schedules' && (
                <><p className="eyebrow">History & Archive</p><h2>Saved Schedules</h2></>
              )}
              {activePage === 'settings' && (
                <><p className="eyebrow">Configuration</p><h2>Settings</h2></>
              )}
            </div>
            {/* Theme Toggle Button (Minimal) */}
            <button 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title="Toggle Theme"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                opacity: 0.7,
                transition: 'opacity 0.2s, transform 0.2s',
                padding: '8px',
                display: 'grid',
                placeItems: 'center'
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Dashboard */}
          {activePage === 'dashboard' && (
            <div className="page-content" style={{ background: 'transparent' }}>
              <ControlPanel onGenerate={handleGenerate} onReset={handleReset} />
              <TimetableSection 
                scheduleMap={scheduleMap} 
                setScheduleMap={setScheduleMap} 
                lastGenerated={lastGenerated} 
                showToast={showToast} 
                settings={settings}
              />
            </div>
          )}

          {/* Schedules */}
          {activePage === 'schedules' && (
            <SchedulesPage showToast={showToast} />
          )}

          {/* Settings */}
          {activePage === 'settings' && (
            <SettingsPage 
              showToast={showToast}
              settings={settings}
              updateSettings={updateSettings}
              resetSettings={resetSettings}
              onClearData={() => {
                setScheduleMap({});
                setLastGenerated(null);
                showToast('All schedule data cleared', 'info');
              }}
            />
          )}
        </main>

        {/* Toasts */}
        <ToastContainer toasts={toasts} />
      </div>
    </>
  );
}
