import React, { useState } from 'react';

const ACCENT_COLORS = [
  { label: 'Violet (Default)', value: '#635bff' },
  { label: 'Blue',             value: '#3089e8' },
  { label: 'Green',            value: '#16a36a' },
  { label: 'Orange',           value: '#ed9142' },
  { label: 'Rose',             value: '#e3517a' },
];

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider"></span>
    </label>
  );
}

export default function SettingsPage({ showToast, settings, updateSettings, resetSettings, onClearData }) {
  /* ── General ── */
  const [institutionName, setInstitutionName] = useState(settings.institutionName);
  const [timezone,        setTimezone]        = useState(settings.timezone);
  const [language,        setLanguage]        = useState(settings.language);

  /* ── Schedule ── */
  const [defaultCohorts,   setDefaultCohorts]   = useState(settings.defaultCohorts);
  const [maxClassesPerProf, setMaxClassesPerProf] = useState(settings.maxClassesPerProf);
  const [classesPerCourse, setClassesPerCourse] = useState(settings.classesPerCourse || 0);
  const [fillEmptySlots,   setFillEmptySlots]   = useState(settings.fillEmptySlots ?? true);
  const [customTimeslots,  setCustomTimeslots]  = useState(settings.customTimeslots || []);

  /* ── Appearance ── */
  const [accentColor, setAccentColor] = useState(settings.accentColor);
  const [compactMode, setCompactMode] = useState(settings.compactMode);
  const [showConflicts, setShowConflicts] = useState(settings.showConflicts);

  /* ── Notifications ── */
  const [notifGenComplete, setNotifGenComplete] = useState(settings.notifGenComplete);
  const [notifConflict,    setNotifConflict]    = useState(settings.notifConflict);
  const [notifExport,      setNotifExport]      = useState(settings.notifExport);

  /* ── Data ── */
  const [autoBackup,    setAutoBackup]    = useState(settings.autoBackup);
  const [backupCount,   setBackupCount]   = useState(settings.backupCount);

  function handleSave() {
    updateSettings({
      institutionName,
      timezone,
      language,
      defaultCohorts,
      maxClassesPerProf,
      classesPerCourse,
      fillEmptySlots,
      customTimeslots,
      accentColor,
      compactMode,
      showConflicts,
      notifGenComplete,
      notifConflict,
      notifExport,
      autoBackup,
      backupCount
    });
    showToast('Settings saved successfully!', 'success');
  }

  function handleReset() {
    resetSettings();
    showToast('Settings reset to defaults.', 'info');
    // Refresh page to sync local states cleanly
    setTimeout(() => window.location.reload(), 500);
  }

  function handleClearData() {
    onClearData();
  }

  return (
    <div className="settings-page">
      {/* ── General ── */}
      <div className="settings-section">
        <p className="settings-section-title">General</p>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Institution Name</h4>
              <p>Displayed in exported schedule headers.</p>
            </div>
            <div className="settings-row-control">
              <input
                className="settings-input"
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Timezone</h4>
              <p>Used for schedule timestamps and export metadata.</p>
            </div>
            <div className="settings-row-control">
              <select
                className="settings-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Language</h4>
              <p>Interface display language.</p>
            </div>
            <div className="settings-row-control">
              <select
                className="settings-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="de">German</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scheduling Engine ── */}
      <div className="settings-section">
        <p className="settings-section-title">Scheduling Engine</p>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Default Number of Cohorts</h4>
              <p>How many cohorts the engine generates schedules for.</p>
            </div>
            <div className="settings-row-control">
              <input
                className="settings-input"
                type="number"
                min="1"
                max="20"
                value={defaultCohorts}
                onChange={(e) => setDefaultCohorts(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Max Classes per Professor</h4>
              <p>Capacity cap used in the network flow algorithm.</p>
            </div>
            <div className="settings-row-control">
              <input
                className="settings-input"
                type="number"
                min="1"
                max="30"
                value={maxClassesPerProf}
                onChange={(e) => setMaxClassesPerProf(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Weekly Sessions per Course</h4>
              <p>Exact number of times each course occurs per week. Set to 0 to auto-pack.</p>
            </div>
            <div className="settings-row-control">
              <input
                className="settings-input"
                type="number"
                min="0"
                max="10"
                value={classesPerCourse}
                onChange={(e) => setClassesPerCourse(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Auto-Fill Empty Slots</h4>
              <p>Automatically map any leftover free periods to Sports / Extracurricular Activities.</p>
            </div>
            <div className="settings-row-control">
              <Toggle checked={fillEmptySlots} onChange={setFillEmptySlots} />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Timeslots Per Day</h4>
              <p>Number of lecture slots scheduled per working day.</p>
            </div>
            <div className="settings-row-control">
              <select
                className="settings-select"
                value={customTimeslots.filter(t => !t.isBreak).length}
                onChange={(e) => {
                   const target = Number(e.target.value);
                   let nextSlots = [...customTimeslots];
                   let lecCount = nextSlots.filter(t => !t.isBreak).length;
                   
                   if (target > lecCount) {
                      while(lecCount < target) {
                         lecCount++;
                         nextSlots.push({ id: `TS_NEW_${Date.now()}_${lecCount}`, label: `New Slot ${lecCount}`, isBreak: false });
                      }
                   } else if (target < lecCount) {
                      while(lecCount > target) {
                         for(let i = nextSlots.length - 1; i >= 0; i--) {
                            if (!nextSlots[i].isBreak) {
                               nextSlots.splice(i, 1);
                               break;
                            }
                         }
                         lecCount--;
                      }
                   }
                   setCustomTimeslots(nextSlots);
                }}
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n} timeslots</option>
                ))}
              </select>
            </div>
          </div>

          <div className="settings-row" style={{ display: 'block' }}>
            <div className="settings-row-info" style={{ marginBottom: 12 }}>
              <h4>Daily Grid Structure</h4>
              <p>Fully customize your schedule's timeslots and breaks.</p>
            </div>
            <div className="settings-row-control" style={{ width: '100%', maxWidth: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customTimeslots.map((ts, idx) => (
                  <div key={ts.id || idx} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                    <input 
                      className="settings-input" 
                      style={{ flex: 1, padding: '0 12px', height: 36, minHeight: 36 }}
                      value={ts.label || ''}
                      onChange={(e) => {
                        const next = [...customTimeslots];
                        next[idx].label = e.target.value;
                        setCustomTimeslots(next);
                      }}
                      placeholder="e.g. 08:15 AM - 09:55 AM"
                    />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Is Break</span>
                      <Toggle 
                        checked={ts.isBreak || false}
                        onChange={(checked) => {
                          const next = [...customTimeslots];
                          next[idx].isBreak = checked;
                          if (checked && !next[idx].breakLabel) next[idx].breakLabel = 'Break';
                          setCustomTimeslots(next);
                        }}
                      />
                    </div>

                    {ts.isBreak ? (
                      <input 
                        className="settings-input" 
                        style={{ width: 100, padding: '0 12px', height: 36, minHeight: 36, flexShrink: 0 }}
                        value={ts.breakLabel || ''}
                        onChange={(e) => {
                          const next = [...customTimeslots];
                          next[idx].breakLabel = e.target.value;
                          setCustomTimeslots(next);
                        }}
                        placeholder="Label"
                      />
                    ) : (
                      <div style={{ width: 100, flexShrink: 0 }} /> // Spacer to keep X buttons aligned
                    )}
                    
                    <button 
                      className="icon-button" 
                      onClick={() => setCustomTimeslots(customTimeslots.filter((_, i) => i !== idx))}
                      style={{ width: 36, height: 36, flexShrink: 0, border: '1px solid var(--danger-soft)', color: 'var(--danger)', display: 'grid', placeItems: 'center' }}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  className="outline-button" 
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                  onClick={() => setCustomTimeslots([...customTimeslots, { id: `TS${Date.now()}`, label: 'New Slot', isBreak: false }])}
                >
                  + Add Timeslot
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="settings-section">
        <p className="settings-section-title">Appearance</p>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Accent Color</h4>
              <p>Primary color used for buttons and active states.</p>
            </div>
            <div className="settings-row-control">
              <div className="color-swatch-row">
                {ACCENT_COLORS.map((c) => (
                  <span
                    key={c.value}
                    className={`color-swatch ${accentColor === c.value ? 'selected' : ''}`}
                    style={{ background: c.value }}
                    title={c.label}
                    onClick={() => setAccentColor(c.value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Compact Mode</h4>
              <p>Reduce spacing in the timetable grid for denser view.</p>
            </div>
            <div className="settings-row-control">
              <Toggle checked={compactMode} onChange={setCompactMode} />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Highlight Conflicts</h4>
              <p>Show visual warnings when scheduling conflicts are detected.</p>
            </div>
            <div className="settings-row-control">
              <Toggle checked={showConflicts} onChange={setShowConflicts} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="settings-section">
        <p className="settings-section-title">Notifications</p>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Generation Complete</h4>
              <p>Notify when a schedule has been successfully generated.</p>
            </div>
            <div className="settings-row-control">
              <Toggle checked={notifGenComplete} onChange={setNotifGenComplete} />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Conflict Detected</h4>
              <p>Notify when the engine detects a scheduling conflict.</p>
            </div>
            <div className="settings-row-control">
              <Toggle checked={notifConflict} onChange={setNotifConflict} />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Export Completed</h4>
              <p>Notify when a CSV export finishes.</p>
            </div>
            <div className="settings-row-control">
              <Toggle checked={notifExport} onChange={setNotifExport} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Data Management ── */}
      <div className="settings-section">
        <p className="settings-section-title">Data Management</p>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Auto Backup</h4>
              <p>Automatically save schedule snapshots on generation.</p>
            </div>
            <div className="settings-row-control">
              <Toggle checked={autoBackup} onChange={setAutoBackup} />
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Backup Retention</h4>
              <p>How many past schedules to keep in the archive.</p>
            </div>
            <div className="settings-row-control">
              <select
                className="settings-select"
                value={backupCount}
                onChange={(e) => setBackupCount(e.target.value)}
              >
                {['3', '5', '10', '20', 'unlimited'].map((v) => (
                  <option key={v} value={v}>{v === 'unlimited' ? 'Unlimited' : `${v} backups`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <h4>Clear All Data</h4>
              <p>Delete all saved schedules from local storage. This cannot be undone.</p>
            </div>
            <div className="settings-row-control">
              <button className="danger-button" onClick={handleClearData}>
                🗑 Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save / Reset bar */}
      <div className="save-settings-bar">
        <button className="secondary-button" onClick={handleReset}>
          Reset to Defaults
        </button>
        <button className="primary-button" onClick={handleSave}>
          ✓ Save Settings
        </button>
      </div>
    </div>
  );
}
