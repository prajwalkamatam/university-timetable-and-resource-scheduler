export function parseCSV(csvText) {
  if (!csvText) return [];
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return [];
  
  // Basic CSV parser to handle quotes
  const parseLine = (line) => {
    const values = [];
    let inQuote = false;
    let curr = '';
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuote = !inQuote;
      else if (line[i] === ',' && !inQuote) { values.push(curr.trim()); curr = ''; }
      else curr += line[i];
    }
    values.push(curr.trim());
    return values;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase());
  
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    let obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    // Fallback: save raw first column value in case headers are weird
    obj._firstCol = values[0] || '';
    return obj;
  });
}

export function generateMockScheduleFromCSV(files, cohortName, existingMap = {}, settings = {}) {
  const scheduleMap = JSON.parse(JSON.stringify(existingMap));
  const targetCohort = cohortName || 'Unnamed-Cohort';
  
  if (!scheduleMap[targetCohort]) {
    scheduleMap[targetCohort] = [];
  }

  if (!files || !files.courses) return scheduleMap;

  const courses = parseCSV(files.courses.content);
  const professors = files.professors ? parseCSV(files.professors.content) : [];
  const rooms = files.rooms ? parseCSV(files.rooms.content) : [];
  
  if (courses.length === 0) return scheduleMap;

  const defaultProfs = professors.length > 0 ? professors : [{ name: 'Staff' }];
  const defaultRooms = rooms.length > 0 ? rooms : [{ name: 'TBA' }];
  const COLORS = ['purple', 'blue', 'green', 'orange'];
  
  const slotsPerDay = settings.timeslotsPerDay || 4;
  const maxProfClasses = settings.maxClassesPerProf || 12;

  // Dynamically calculate valid slots based on settings
  const activeSlots = settings.customTimeslots || [
    { id: 'TS1', isBreak: false }, { id: 'TS3', isBreak: false },
    { id: 'TS5', isBreak: false }, { id: 'TS6', isBreak: false }
  ];
  const validTsIds = activeSlots.filter(t => !t.isBreak).map(t => t.id);
  
  // Group CSV rows by unique course names so we don't accidentally multiply them
  const coursesByName = {};
  courses.forEach((c, i) => {
    const courseName = c['course name'] || c.course || c.name || c.subject || c._firstCol || 'Unknown Course';
    if (!coursesByName[courseName]) coursesByName[courseName] = [];
    coursesByName[courseName].push({ ...c, originalIndex: i });
  });

  const uniqueCourseNames = Object.keys(coursesByName);

  // Use the new explicit setting, or fallback to auto-packing 100% of the grid
  let globalTarget = settings.classesPerCourse;
  if (!globalTarget || globalTarget <= 0) {
     globalTarget = Math.max(1, Math.round((validTsIds.length * 6) / (uniqueCourseNames.length || 1)));
  }

  // Determine occurrences per unique course
  const courseCounts = {};
  uniqueCourseNames.forEach(courseName => {
    // 1. Check UI Overrides first
    const override = settings.courseOverrides?.[courseName];
    if (override !== undefined) {
       courseCounts[courseName] = override; // Allow 0 to completely skip a course
       return;
    }

    // 2. Check CSV Columns second (check the first row provided for this course)
    const c = coursesByName[courseName][0];
    const specific = parseInt(c.sessions || c.occurrences || c.classes || c['classes per week'] || c['sessions per week']);
    
    // 3. Fallback to global target
    courseCounts[courseName] = (!isNaN(specific) && specific > 0) ? specific : globalTarget;
  });

  const maxOccurrences = Math.max(...Object.values(courseCounts), 1);

  // 1. Build the list of all tasks to schedule, perfectly interleaved to avoid same-day collisions natively
  const tasks = [];
  for (let occ = 0; occ < maxOccurrences; occ++) {
    uniqueCourseNames.forEach(courseName => {
      const targetCount = courseCounts[courseName];
      if (occ >= targetCount) return; // This course has reached its specific weekly target

      // Cycle through the rows provided for this course (so different professors are used if provided)
      const rows = coursesByName[courseName];
      const c = rows[occ % rows.length];
      const i = c.originalIndex;
      
      let profName = c['faculty name'] || c.faculty || c['professor name'] || c.professor || c.instructor || c.teacher;
      if (!profName) {
        const cSub = c.subject || c['course name'] || c._firstCol || '';
        const matchingProfs = defaultProfs.filter(p => {
          const pSub = p.subject || p['professor name'] || p._firstCol || '';
          return pSub && cSub && pSub.toLowerCase().includes(cSub.toLowerCase());
        });
        const prof = matchingProfs.length > 0 ? matchingProfs[i % matchingProfs.length] : defaultProfs[i % defaultProfs.length];
        profName = prof['professor name'] || prof.professor || prof.name || prof._firstCol || 'Staff';
      }
      
      // Enforce max classes per professor setting
      let profClassCount = 0;
      for (const cohort of Object.values(scheduleMap)) {
          profClassCount += cohort.filter(cls => cls.professor === profName).length;
      }
      if (profClassCount >= maxProfClasses) {
          profName = 'Staff (Limit Reached)';
      }
      
      let roomName = c['room name'] || c.room || c.location;
      if (!roomName) {
        const room = defaultRooms[i % defaultRooms.length];
        roomName = room['room name'] || room.name || room.room || room._firstCol || 'TBA';
      }
      
      // Calculate how many times this specific course is allowed to appear per day 
      // based on its total weekly count across 6 working days.
      const taskMaxPerDay = Math.max(1, Math.ceil(targetCount / 6));

      tasks.push({
        cohort: targetCohort,
        code: c.id || c.code || `C-${i}-${occ}`,
        course: courseName,
        professor: profName,
        room: roomName,
        color: COLORS[i % COLORS.length],
        maxPerDay: taskMaxPerDay
      });
    });
  }

  // 2. Generate Domain (all possible Day/Time slots)
  const allSlots = [];
  for (let day = 0; day < 6; day++) {
    for (const ts of validTsIds) {
      allSlots.push({ day, ts });
    }
  }

  // Helper to check constraints
  function isValidPlacement(task, slot, currentSchedule) {
    // A. Check against already generated cohorts
    for (const [cohortKey, cohortClasses] of Object.entries(scheduleMap)) {
      for (const c of cohortClasses) {
        if (c.ts === slot.ts && c.day === slot.day) {
           if (cohortKey === targetCohort) return false; // Should not happen, handled below
           
           // Same professor teaching in another cohort (ignore if it's generic Staff)
           if (c.professor === task.professor && !task.professor.includes('Staff')) return false;
           
           if (c.room === task.room && task.room !== 'TBA' && task.room !== 'Online') return false;
        }
      }
    }
    
    // B. Check within the current cohort being built
    for (const c of currentSchedule) {
      if (c.ts === slot.ts && c.day === slot.day) return false; // Cohort is already in class
    }
    
    return true;
  }

  // 3. Advanced Backtracking Solver with MRV (Minimum Remaining Values)
  const startTime = Date.now();
  let bestSchedule = [];

  // Add unique IDs to tasks for tracking
  tasks.forEach((t, idx) => t._id = `T${idx}`);

  function getValidSlotsForTask(task, currentSchedule) {
    const valid = [];
    for (const slot of allSlots) {
      if (!isValidPlacement(task, slot, currentSchedule)) continue;
      const sameDayCount = currentSchedule.filter(c => c.day === slot.day && c.course === task.course).length;
      if (sameDayCount < task.maxPerDay) {
        valid.push(slot);
      }
    }
    return valid;
  }

  function solveMRV(remainingTasks, currentSchedule) {
    if (remainingTasks.length === 0) {
      bestSchedule = [...currentSchedule];
      return true; // 100% placement achieved!
    }

    // Safety timeout: 2.5 seconds
    if (Date.now() - startTime > 2500) {
      if (currentSchedule.length > bestSchedule.length) {
        bestSchedule = [...currentSchedule];
      }
      return false;
    }

    // MRV Heuristic: Pick the task that has the FEWEST available slots left
    let bestTaskIdx = -1;
    let minSlots = Infinity;
    let bestValidSlots = [];

    for (let i = 0; i < remainingTasks.length; i++) {
      const task = remainingTasks[i];
      const validSlots = getValidSlotsForTask(task, currentSchedule);
      
      if (validSlots.length === 0) {
        // Dead end! A task has 0 possible slots. Prune this branch immediately.
        if (currentSchedule.length > bestSchedule.length) {
           bestSchedule = [...currentSchedule];
        }
        return false;
      }
      
      if (validSlots.length < minSlots) {
        minSlots = validSlots.length;
        bestTaskIdx = i;
        bestValidSlots = validSlots;
      }
    }

    const taskToPlace = remainingTasks[bestTaskIdx];
    const nextRemaining = remainingTasks.filter((_, i) => i !== bestTaskIdx);

    // Randomize slots to scatter classes naturally across the week
    bestValidSlots.sort(() => Math.random() - 0.5);

    for (const slot of bestValidSlots) {
      currentSchedule.push({ ...taskToPlace, day: slot.day, ts: slot.ts });
      
      if (solveMRV(nextRemaining, currentSchedule)) {
        return true;
      }
      
      // Backtrack
      currentSchedule.pop();
    }

    return false;
  }

  solveMRV([...tasks], []);

  // 4. Emergency Hole Filler (Relax Constraints)
  // If the strict same-day constraint caused a deadlock, we fill the remaining holes 
  // by allowing same-day duplicates, but we try to MINIMIZE them as much as possible.
  if (bestSchedule.length < tasks.length) {
    const placedIds = new Set(bestSchedule.map(c => c._id));
    const missingTasks = tasks.filter(t => !placedIds.has(t._id));
    
    for (const task of missingTasks) {
      // Find all physically valid slots
      const physicallyValidSlots = allSlots.filter(slot => isValidPlacement(task, slot, bestSchedule));
      
      if (physicallyValidSlots.length > 0) {
        // Sort the slots to prioritize days that DO NOT already have this course
        physicallyValidSlots.sort((a, b) => {
          const countA = bestSchedule.filter(c => c.day === a.day && c.course === task.course).length;
          const countB = bestSchedule.filter(c => c.day === b.day && c.course === task.course).length;
          return countA - countB;
        });
        
        // Pick the best one (the one that causes the fewest duplicates)
        const bestSlot = physicallyValidSlots[0];
        bestSchedule.push({ ...task, day: bestSlot.day, ts: bestSlot.ts });
      }
    }
  }
  // 5. Auto-Fill Empty Slots (Sports / Extracurricular)
  // If enabled, finds any completely empty slots in the cohort's grid and maps them to an activity.
  if (settings.fillEmptySlots !== false) {
    const occupied = new Set(bestSchedule.map(c => `${c.day}-${c.ts}`));
    allSlots.forEach(slot => {
       if (!occupied.has(`${slot.day}-${slot.ts}`)) {
          bestSchedule.push({
             _id: `FILL-${slot.day}-${slot.ts}`,
             cohort: targetCohort,
             day: slot.day,
             ts: slot.ts,
             code: `ACT-${slot.day}`,
             course: 'Sports / Extra Curricular',
             professor: 'Physical Director / Staff',
             room: 'Sports Ground',
             color: '#78909C', // Distinctive neutral blue-grey color
             isActivity: true
          });
       }
    });
  }

  scheduleMap[targetCohort] = bestSchedule;

  return scheduleMap;
}
