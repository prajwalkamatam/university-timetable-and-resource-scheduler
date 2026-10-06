import { useState, useEffect } from 'react';

export const initialScheduleData = {};

export const defaultSettings = {
  institutionName: 'State University',
  timezone: 'Asia/Kolkata',
  language: 'en',
  defaultCohorts: 3,
  maxClassesPerProf: 12,
  classesPerCourse: 0,
  fillEmptySlots: true,
  customTimeslots: [
    { id: 'TS1', label: '08:15 AM - 09:55 AM', isBreak: false },
    { id: 'TS2', label: '09:55 AM - 10:10 AM', isBreak: true, breakLabel: 'Tea Break' },
    { id: 'TS3', label: '10:10 AM - 11:50 AM', isBreak: false },
    { id: 'TS4', label: '11:50 AM - 12:45 PM', isBreak: true, breakLabel: 'Lunch Break' },
    { id: 'TS5', label: '12:45 PM - 02:20 PM', isBreak: false },
    { id: 'TS6', label: '02:20 PM - 04:00 PM', isBreak: false },
  ],
  accentColor: '#635bff',
  compactMode: false,
  showConflicts: true,
  notifGenComplete: true,
  notifConflict: true,
  notifExport: true,
  autoBackup: true,
  backupCount: '5'
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
  };

  return { settings, updateSettings, resetSettings };
}
