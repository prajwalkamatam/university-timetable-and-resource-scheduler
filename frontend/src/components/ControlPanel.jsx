import React, { useState, useEffect } from 'react';
import { parseCSV } from '../mockEngine';

const FILE_SLOTS = [
  { key: 'professors', label: 'Professors CSV', filename: 'professors.csv' },
  { key: 'courses',    label: 'Courses CSV',    filename: 'courses.csv'    },
  { key: 'rooms',      label: 'Rooms CSV',      filename: 'rooms.csv'      },
  { key: 'cohorts',    label: 'Cohorts CSV',    filename: 'cohorts.csv'    },
];

export default function ControlPanel({ onGenerate, onReset }) {
  const [weekNumber,    setWeekNumber]    = useState(1);
  const [cohortName,    setCohortName]    = useState('');
  
  // Persist uploaded files across reloads
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('uni_saved_csvs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('uni_saved_csvs', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  const [generating,    setGenerating]    = useState(false);
  const [courseOverrides, setCourseOverrides] = useState({});
  
  // Parse courses CSV to allow inline editing of session counts
  useEffect(() => {
    if (uploadedFiles.courses?.content) {
      try {
        const parsedData = parseCSV(uploadedFiles.courses.content);
        const overrides = {};
        parsedData.forEach(c => {
          const courseName = c['course name'] || c.course || c.name || c.subject || c._firstCol;
          if (courseName && !overrides[courseName]) {
            const specific = parseInt(c.sessions || c.occurrences || c.classes || c['classes per week'] || c['sessions per week']);
            overrides[courseName] = !isNaN(specific) && specific > 0 ? specific : 0;
          }
        });
        setCourseOverrides(overrides);
      } catch (e) {
        console.error("Failed to parse courses CSV", e);
        setCourseOverrides({});
      }
    } else {
      setCourseOverrides({});
    }
  }, [uploadedFiles.courses]);
  
  // Google Sheets state
  const [uploadMode,    setUploadMode]    = useState('csv'); // 'csv' | 'sheets'
  const [sheetUrl,      setSheetUrl]      = useState('');
  const [fetchingSheet, setFetchingSheet] = useState(false);

  const uploadedCount = Object.keys(uploadedFiles).length;
  // We only absolutely need courses to generate something. Cohort name is optional (auto-generates).
  const allReady = uploadedCount >= 1;

  function handleFileChange(key, e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setUploadedFiles((prev) => ({ 
        ...prev, 
        [key]: { name: file.name, content: evt.target.result } 
      }));
    };
    reader.readAsText(file);
  }

  async function handleFetchSheet() {
    if (!sheetUrl) return;
    setFetchingSheet(true);
    // Simulate fetching Google Sheets CSV export
    await new Promise((r) => setTimeout(r, 1200));
    setUploadedFiles({
      professors: { name: 'Google Sheet (Professors)', content: 'id,name,subject\n1,Prof. Smith,Math' },
      courses: { name: 'Google Sheet (Courses)', content: 'id,name,subject,cohort\n1,Calculus,Math,Cohort-1' },
      rooms: { name: 'Google Sheet (Rooms)', content: 'id,name,capacity\n1,Room 101,30' },
      cohorts: { name: 'Google Sheet (Cohorts)', content: 'id,name\n1,Cohort-1' }
    });
    setFetchingSheet(false);
  }

  async function handleGenerate() {
    if (!allReady) return;
    setGenerating(true);
    // Simulate engine processing delay (1.5s)
    await new Promise((r) => setTimeout(r, 800));
    setGenerating(false);
    onGenerate({ weekNumber, files: uploadedFiles, cohortName: cohortName.trim(), courseOverrides });
    
    // Clear the specific cohort data to prepare for the next cohort upload, but keep the files intact!
    setCohortName('');
  }

  function handleReset() {
    setWeekNumber(1);
    setCohortName('');
    setUploadedFiles({});
    setSheetUrl('');
    document.querySelectorAll('input[type="file"]').forEach(el => el.value = '');
    onReset();
  }

  return (
    <section className="control-panel card">
      {/* Header */}
      <div className="section-heading">
        <div>
          <p className="section-label">Configuration</p>
          <h3>Control Panel</h3>
          <p className="section-description">
            Upload source data to incrementally build your timetable.
          </p>
        </div>
        <span className="engine-badge">
          <span className="badge-dot"></span>
          Engine online
        </span>
      </div>

      {/* Form */}
      <div className="form-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="form-group">
          <label htmlFor="cohort-name">Cohort Name (e.g., Sec1)</label>
          <div className="input-wrapper">
            <span className="input-icon">✎</span>
            <input
              type="text"
              id="cohort-name"
              value={cohortName}
              placeholder="Enter cohort..."
              onChange={(e) => setCohortName(e.target.value)}
            />
          </div>
          <small>The class or section for this data.</small>
        </div>
        <div className="form-group">
          <label htmlFor="week-number">Week Number / Seed</label>
          <div className="input-wrapper">
            <span className="input-icon">#</span>
            <input
              type="number"
              id="week-number"
              value={weekNumber}
              min="1"
              max="52"
              placeholder="Enter week"
              onChange={(e) => setWeekNumber(Number(e.target.value))}
            />
          </div>
          <small>The week number is used as the random seed.</small>
        </div>
      </div>

      {/* Upload Section Toggle */}
      <div className="upload-section">
        <div className="upload-heading">
          <div>
            <h4>Source Data for {cohortName || 'Cohort'}</h4>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                className={uploadMode === 'csv' ? 'primary-button' : 'secondary-button'} 
                style={{ height: '30px', padding: '0 12px', fontSize: '11px' }}
                onClick={() => setUploadMode('csv')}
              >
                CSV Upload
              </button>
              <button 
                className={uploadMode === 'sheets' ? 'primary-button' : 'secondary-button'}
                style={{ height: '30px', padding: '0 12px', fontSize: '11px' }}
                onClick={() => setUploadMode('sheets')}
              >
                Google Sheets
              </button>
            </div>
          </div>
        </div>

        {uploadMode === 'csv' ? (
          <div className="file-grid" style={{ marginTop: '16px' }}>
            {FILE_SLOTS.map(({ key, label, filename }) => {
              const uploaded = !!uploadedFiles[key];
              return (
                <label key={key} className={`file-upload ${uploaded ? 'uploaded' : ''}`}>
                  <input
                    type="file"
                    accept=".csv"
                    onClick={(e) => { e.target.value = null; }}
                    onChange={(e) => handleFileChange(key, e)}
                    style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
                  />
                  <span className="file-upload-icon">{uploaded ? '✓' : '↑'}</span>
                  <span className="file-upload-content">
                    <strong>{label}</strong>
                    <small>{uploadedFiles[key]?.name || filename}</small>
                  </span>
                  <span className="file-upload-status">{uploaded ? 'Uploaded' : 'Browse'}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Paste Public Google Sheet URL..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
              <small>Must contain tabs named: Professors, Courses, Rooms, Cohorts</small>
            </div>
            <button 
              className="primary-button" 
              onClick={handleFetchSheet} 
              disabled={fetchingSheet || !sheetUrl}
              style={{ height: '42px' }}
            >
              {fetchingSheet ? 'Syncing...' : 'Sync Data'}
            </button>
          </div>
        )}
      </div>

      {/* Inline Session Editor */}
      {Object.keys(courseOverrides).length > 0 && (
        <div className="upload-section" style={{ marginTop: '16px' }}>
          <h4>Session Editor</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Set how many times each course occurs in the week. Set to 0 to use the global default.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '8px' }}>
            {Object.entries(courseOverrides).map(([course, count]) => (
              <div key={course} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={course}>
                  {course}
                </span>
                <input 
                  type="number" 
                  min="0" 
                  max="20"
                  style={{ width: '45px', padding: '4px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  value={count} 
                  onChange={e => setCourseOverrides(prev => ({...prev, [course]: Number(e.target.value)}))} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="control-actions">
        <button className="secondary-button" type="button" onClick={handleReset}>
          Reset Everything
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={handleGenerate}
          disabled={generating || !allReady}
        >
          {generating ? (
            <>
              <span className="spinner"></span>
              Generating…
            </>
          ) : (
            <>
              <span>⚡</span>
              Add Cohort to Schedule
            </>
          )}
        </button>
      </div>
    </section>
  );
}
