import React, { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay, pointerWithin } from '@dnd-kit/core';

const BASE_TIMESLOTS = [
  { id: 'TS1',  label: '08:15 AM - 09:55 AM', type: 'lecture' },
  { id: 'TS2',  label: '09:55 AM - 10:10 AM', isBreak: true, breakLabel: 'Tea Break' },
  { id: 'TS3',  label: '10:10 AM - 11:50 AM', type: 'lecture' },
  { id: 'TS4',  label: '11:50 AM - 12:45 PM', isBreak: true, breakLabel: 'Lunch Break' },
  { id: 'TS5',  label: '12:45 PM - 02:20 PM', type: 'lecture' },
  { id: 'TS6',  label: '02:20 PM - 04:00 PM', type: 'lecture' },
  { id: 'TS7',  label: '04:00 PM - 05:40 PM', type: 'lecture' },
  { id: 'TS8',  label: '05:40 PM - 07:20 PM', type: 'lecture' },
  { id: 'TS9',  label: '07:20 PM - 09:00 PM', type: 'lecture' },
  { id: 'TS10', label: '09:00 PM - 10:40 PM', type: 'lecture' },
  { id: 'TS11', label: '10:40 PM - 12:20 AM', type: 'lecture' },
  { id: 'TS12', label: '12:20 AM - 02:00 AM', type: 'lecture' },
];

const DAYS = [
  { name: 'Monday',    date: 'Mon' },
  { name: 'Tuesday',   date: 'Tue' },
  { name: 'Wednesday', date: 'Wed' },
  { name: 'Thursday',  date: 'Thu' },
  { name: 'Friday',    date: 'Fri' },
  { name: 'Saturday',  date: 'Sat' },
];

function getCellClass(color) {
  return `schedule-card ${color}-card`;
}

// ── DnD Components ──
function DroppableCell({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`schedule-cell ${isOver ? 'drop-target' : ''}`} style={{ transition: 'background 0.2s' }}>
      {children}
    </div>
  );
}

function DraggableCard({ cell, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${cell.cohort}-${cell.code}-${cell.ts}-${cell.day}`,
    data: cell,
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999 } : undefined;

  return (
    <article
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.4 : 1, cursor: 'grab' }}
      {...listeners}
      {...attributes}
      className={getCellClass(cell.color || 'blue')}
      onClick={() => onClick(cell)}
    >
      <span className="course-code">{cell.code}</span>
      <h4>{cell.course}</h4>
      <p className="professor">{cell.professor}</p>
      <span className="room">⌂ {cell.room}</span>
    </article>
  );
}

export default function TimetableSection({ scheduleMap, setScheduleMap, lastGenerated, showToast, settings }) {
  const COHORTS = Object.keys(scheduleMap || {});
  
  const [selectedCohort, setSelectedCohort] = useState(COHORTS[0] || '');
  const [selectedCard,   setSelectedCard]   = useState(null);
  const [activeDragId,   setActiveDragId]   = useState(null);
  const [activeDragData, setActiveDragData] = useState(null);

  // Sync selected cohort when available cohorts change
  useEffect(() => {
    if (COHORTS.length > 0 && !COHORTS.includes(selectedCohort)) {
      setSelectedCohort(COHORTS[0]);
    }
  }, [COHORTS, selectedCohort]);

  if (COHORTS.length === 0) {
    return (
      <section className="timetable-section card" style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '8px' }}>No Schedule Generated</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Upload your data and click Generate to view the timetable.</p>
      </section>
    );
  }

  const isAllCohorts = selectedCohort === 'All Cohorts';
  const schedule = isAllCohorts
    ? Object.values(scheduleMap).flat()
    : (scheduleMap[selectedCohort] || []);

  const rooms   = [...new Set(schedule.map((s) => s.room))];
  const classes = schedule.length;
  
  const displayTimeslots = settings?.customTimeslots || BASE_TIMESLOTS;

  function getCells(ts, dayIdx) {
    return schedule.filter((s) => s.ts === ts && s.day === dayIdx);
  }

  function handleExport() {
    const institution = settings?.institutionName || 'University';
    const rows = [[`Schedule for ${selectedCohort} - ${institution}`]];
    rows.push([]);
    rows.push(['Timeslot', 'Day', 'Course Code', 'Course', 'Professor', 'Room']);
    schedule.forEach((s) => {
      const tsLabel = displayTimeslots.find(t => t.id === s.ts)?.label || s.ts;
      rows.push([tsLabel, DAYS[s.day].name, s.code, s.course, s.professor, s.room]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `schedule_${selectedCohort}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (settings?.notifExport) {
      showToast(`Exported schedule for ${selectedCohort}`, 'success');
    }
  }

  function handleExportICal() {
    const institution = settings?.institutionName || 'University';
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//UniScheduler//EN\nCALSCALE:GREGORIAN\n";
    const year = new Date().getFullYear();
    const monthMap = { 'Jan':'01', 'Feb':'02', 'Mar':'03', 'Apr':'04', 'May':'05', 'Jun':'06', 'Jul':'07', 'Aug':'08', 'Sep':'09', 'Oct':'10', 'Nov':'11', 'Dec':'12' };

    schedule.forEach((s) => {
      const [dayNum, monthStr] = DAYS[s.day].date.split(' ');
      const month = monthMap[monthStr] || '09';
      const dateStr = `${year}${month}${dayNum.padStart(2, '0')}`;

      const tsObj = displayTimeslots.find(t => t.id === s.ts);
      if(!tsObj) return;
      const [start, end] = tsObj.label.split(' - ');
      const startTime = start.replace(':', '') + '00';
      const endTime = end.replace(':', '') + '00';

      icsContent += `BEGIN:VEVENT\n`;
      icsContent += `SUMMARY:${s.code} - ${s.course}\n`;
      icsContent += `DTSTART:${dateStr}T${startTime}\n`;
      icsContent += `DTEND:${dateStr}T${endTime}\n`;
      icsContent += `LOCATION:${s.room}\n`;
      icsContent += `DESCRIPTION:Instructor: ${s.professor} (${institution})\n`;
      icsContent += `END:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `schedule_${selectedCohort}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    if (settings?.notifExport) {
      showToast(`Exported calendar for ${selectedCohort}`, 'success');
    }
  }

  // ── Drag & Drop Handlers ──
  function handleDragStart(event) {
    setActiveDragId(event.active.id);
    setActiveDragData(event.active.data.current);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveDragData(null);
    
    if (!over) return;
    
    const activeCell = active.data.current;
    const [destTs, destDayStr] = over.id.split('-');
    const destDay = parseInt(destDayStr, 10);

    if (activeCell.ts === destTs && activeCell.day === destDay) return;

    // CONFLICT VALIDATION: Is professor busy in another cohort at this exact time?
    const allCohortsClasses = Object.values(scheduleMap).flat();
    const conflict = allCohortsClasses.find(c => 
      c.ts === destTs && 
      c.day === destDay && 
      c.professor === activeCell.professor
    );

    if (conflict) {
      if (settings?.notifConflict) {
        showToast(`Conflict Warning! ${activeCell.professor} is already teaching in ${conflict.room}. Move rejected.`, 'error');
      }
      return; // Reject move
    }

    // Update state
    setScheduleMap(prev => {
      const newMap = { ...prev };
      const cohortList = [...(newMap[activeCell.cohort] || [])];
      
      const existingIdx = cohortList.findIndex(c => c.ts === destTs && c.day === destDay);
      const sourceIdx = cohortList.findIndex(c => c.code === activeCell.code && c.ts === activeCell.ts && c.day === activeCell.day);
      
      if (existingIdx >= 0) {
        cohortList[existingIdx] = { ...cohortList[existingIdx], ts: activeCell.ts, day: activeCell.day };
      }
      
      if (sourceIdx >= 0) {
        cohortList[sourceIdx] = { ...cohortList[sourceIdx], ts: destTs, day: destDay };
      }
      
      newMap[activeCell.cohort] = cohortList;
      return newMap;
    });
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
      <section className="timetable-section">
        {/* Heading */}
        <div className="section-heading timetable-heading">
          <div>
            <p className="section-label">Generated Result</p>
            <h3>Weekly Timetable</h3>
            <p className="section-description">
              Drag and drop classes to adjust the schedule. Conflicting moves will be rejected automatically.
            </p>
          </div>

          <div className="timetable-controls">
            <label htmlFor="display-cohort">Viewing</label>
            <select id="display-cohort" value={selectedCohort} onChange={(e) => setSelectedCohort(e.target.value)}>
              <option value="All Cohorts">All Cohorts (Master)</option>
              {COHORTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="outline-button" type="button" onClick={handleExport}>↓ Export CSV</button>
              <button className="outline-button" type="button" onClick={handleExportICal}>📅 Export iCal</button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="schedule-summary">
          <div className="summary-item">
            <span className="summary-icon purple">▦</span>
            <div><span className="summary-label">Cohort</span><strong>{selectedCohort}</strong></div>
          </div>
          <div className="summary-item">
            <span className="summary-icon blue">◷</span>
            <div><span className="summary-label">Total Classes</span><strong>{classes}</strong></div>
          </div>
          <div className="summary-item">
            <span className="summary-icon green">⌂</span>
            <div><span className="summary-label">Rooms Used</span><strong>{rooms.length}</strong></div>
          </div>
          <div className="summary-item">
            <span className="summary-icon orange">✓</span>
            <div><span className="summary-label">Conflicts</span><strong className="success-text">None</strong></div>
          </div>
        </div>

        {/* Grid */}
        <div className="timetable-card card">
          <div className="timetable-scroll">
            <div 
              className="timetable-grid"
              style={{
                gridTemplateColumns: `90px ${displayTimeslots.map(ts => ts.isBreak ? '60px' : 'minmax(140px, 1fr)').join(' ')}`
              }}
            >
              {/* Top Header Row: Timeslots */}
              <div className="grid-corner" style={{ justifyContent: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Time/ Day</span>
              </div>
              {displayTimeslots.map((ts) => (
                <div key={ts.id} className="day-header" style={{ padding: '8px 4px', textAlign: 'center', background: ts.isBreak ? 'var(--bg-inset)' : '' }}>
                  <strong style={{ fontSize: '11px', display: 'block' }}>{ts.label.split(' - ')[0]}</strong>
                  <span style={{ fontSize: '11px' }}>{ts.label.split(' - ')[1]}</span>
                </div>
              ))}

              {/* Body Rows: Days */}
              {DAYS.map((d, dayIdx) => (
                <React.Fragment key={d.name}>
                  {/* Row Header: Day */}
                  <div className="timeslot-label" style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px' }}>{d.date.toUpperCase()}</strong>
                  </div>

                  {/* Columns for this Day */}
                  {displayTimeslots.map((ts) => {
                    if (ts.isBreak && settings?.includeLunch !== false) {
                      // Render an empty break column cell. We only put text in the middle of the week for aesthetics.
                      return (
                        <div 
                          key={`${ts.id}-${dayIdx}`} 
                          className="break-cell" 
                          style={{ 
                            background: 'transparent',
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {dayIdx === 2 ? <span style={{ opacity: 0.4, fontSize: '11px', letterSpacing: '2px' }}>{ts.breakLabel}</span> : null}
                        </div>
                      );
                    } else if (ts.isBreak) {
                      return <div key={`${ts.id}-${dayIdx}`} className="break-cell" />;
                    }

                    // Render standard class droppable cell
                    const cells = getCells(ts.id, dayIdx);
                    return (
                      <DroppableCell key={`${ts.id}-${dayIdx}`} id={`${ts.id}-${dayIdx}`}>
                        {cells.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', height: '100%' }}>
                            {cells.map((c, i) => (
                              <DraggableCard key={`${c.cohort}-${c.code}-${i}`} cell={c} onClick={setSelectedCard} />
                            ))}
                          </div>
                        ) : (
                          <span style={{ opacity: 0.3 }}>—</span>
                        )}
                      </DroppableCell>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="timetable-footer">
            <div className="legend">
              {[
                { color: 'purple', label: 'Computer Science' },
                { color: 'blue',   label: 'Core Subject' },
                { color: 'green',  label: 'Laboratory' },
                { color: 'orange', label: 'Elective' },
              ].map((l) => (
                <span key={l.color} className="legend-item">
                  <span className={`legend-dot ${l.color}`}></span>{l.label}
                </span>
              ))}
            </div>
            <span className="last-updated">
              {lastGenerated ? `Last generated: ${lastGenerated}` : 'Not yet generated'}
            </span>
          </div>
        </div>

        {/* Class Detail Modal */}
        {selectedCard && (
          <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Class Details</h3>
                <button className="modal-close" onClick={() => setSelectedCard(null)}>✕</button>
              </div>
              {[
                ['Course Code', selectedCard.code],
                ['Course',      selectedCard.course],
                ['Professor',   selectedCard.professor],
                ['Room',        selectedCard.room],
                ['Timeslot',    selectedCard.ts],
                ['Day',         DAYS[selectedCard.day].name],
              ].map(([label, value]) => (
                <div key={label} className="modal-row">
                  <span className="modal-row-label">{label}</span>
                  <span className="modal-row-value">{value}</span>
                </div>
              ))}
              <div className="modal-footer">
                <button className="secondary-button" onClick={() => setSelectedCard(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Drag Overlay for smooth animations while dragging */}
      <DragOverlay>
        {activeDragData ? (
          <article className={getCellClass(activeDragData.color || 'blue')} style={{ transform: 'scale(1.05)', boxShadow: 'var(--shadow-md)' }}>
            <span className="course-code">{activeDragData.code}</span>
            <h4>{activeDragData.course}</h4>
            <p className="professor">{activeDragData.professor}</p>
            <span className="room">⌂ {activeDragData.room}</span>
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
