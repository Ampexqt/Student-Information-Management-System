// Utility functions for class schedule management

/**
 * Convert a time string (e.g., '8:00 AM') to minutes since midnight.
 */
export function toMinutes(time) {
  if (!time) return null;
  let [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  let min = parseInt(m, 10);
  if (time.toLowerCase().includes('pm') && hour !== 12) hour += 12;
  if (time.toLowerCase().includes('am') && hour === 12) hour = 0;
  return hour * 60 + min;
}

/**
 * Convert minutes since midnight to time string (e.g., '8:00 AM').
 */
export function fromMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '';
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Get shift information for a grade level.
 * @param {string} grade - The grade level (7, 8, 9, 10)
 * @returns {object} - Shift information with name, start, end times
 */
export function getShiftForGrade(grade) {
  const gradeNum = parseInt(grade, 10);
  if (gradeNum === 7 || gradeNum === 8) {
    return {
      name: 'morning',
      start: '6:30 AM',
      end: '12:00 PM',
      startMinutes: 390, // 6:30 AM
      endMinutes: 720,   // 12:00 PM
      displayName: 'Morning Shift'
    };
  } else if (gradeNum === 9 || gradeNum === 10) {
    return {
      name: 'afternoon',
      start: '12:30 PM',
      end: '6:00 PM',
      startMinutes: 750, // 12:30 PM
      endMinutes: 1080,  // 6:00 PM
      displayName: 'Afternoon Shift'
    };
  }
  return null;
}

/**
 * Validate if a time is within the allowed shift for a grade.
 * @param {string} time - Time string (e.g., '8:00 AM')
 * @param {string} grade - Grade level
 * @returns {boolean} - True if time is valid for the grade's shift
 */
export function isTimeInShift(time, grade) {
  const shift = getShiftForGrade(grade);
  if (!shift) return false;
  
  const timeMinutes = toMinutes(time);
  if (timeMinutes === null) return false;
  
  return timeMinutes >= shift.startMinutes && timeMinutes <= shift.endMinutes;
}

/**
 * Check if two time ranges overlap.
 */
export function isTimeOverlap(startA, endA, startB, endB) {
  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false;
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Validate schedule times for a specific grade level.
 * @param {Array} schedule - Array of {day, start, end, subject, teacher}
 * @param {string} grade - Grade level
 * @returns {object} - {valid: boolean, errors: Array}
 */
export function validateScheduleForGrade(schedule, grade) {
  const shift = getShiftForGrade(grade);
  if (!shift) {
    return {
      valid: false,
      errors: [`Invalid grade level: ${grade}. Only grades 7-10 are supported.`]
    };
  }

  const errors = [];
  
  for (const slot of schedule) {
    if (!slot.start || !slot.end) {
      errors.push(`Incomplete time slot for ${slot.day}`);
      continue;
    }

    // Check if start time is within shift
    if (!isTimeInShift(slot.start, grade)) {
      errors.push(`${slot.day} start time (${slot.start}) is outside the ${shift.displayName} (${shift.start} - ${shift.end})`);
    }

    // Check if end time is within shift
    if (!isTimeInShift(slot.end, grade)) {
      errors.push(`${slot.day} end time (${slot.end}) is outside the ${shift.displayName} (${shift.start} - ${shift.end})`);
    }

    // Check if start is before end
    const startMinutes = toMinutes(slot.start);
    const endMinutes = toMinutes(slot.end);
    if (startMinutes >= endMinutes) {
      errors.push(`${slot.day} start time must be before end time`);
    }

    // Check for minimum class duration (30 minutes)
    if (endMinutes - startMinutes < 30) {
      errors.push(`${slot.day} class duration must be at least 30 minutes`);
    }

    // Check for subject
    if (!slot.subject || !slot.subject.trim()) {
      errors.push(`${slot.day} subject is required`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a new schedule conflicts with any existing schedules for a classroom within the same shift.
 * @param {Array} newSchedule - Array of {day, start, end, subject, teacher}
 * @param {Array} existingSchedules - Array of class objects with classroomId and schedule
 * @param {string} classroomId - The classroom being checked
 * @param {string} grade - Grade level for shift validation
 * @param {string} [ignoreClassId] - Optional class ID to ignore (for editing)
 * @returns {string|null} - Returns error message if conflict, otherwise null
 */
export function checkScheduleConflict(newSchedule, existingSchedules, classroomId, grade, ignoreClassId) {
  const shift = getShiftForGrade(grade);
  if (!shift) {
    return `Invalid grade level: ${grade}. Only grades 7-10 are supported.`;
  }

  for (const cls of existingSchedules) {
    if (cls.classroomId === classroomId && (!ignoreClassId || cls.id !== ignoreClassId)) {
      // Check if the existing class is in the same shift
      const existingShift = getShiftForGrade(cls.classGrade);
      if (existingShift && existingShift.name === shift.name) {
        if (Array.isArray(cls.schedule)) {
          for (const sched of newSchedule) {
            for (const other of cls.schedule) {
              if (sched.day === other.day) {
                if (isTimeOverlap(sched.start, sched.end, other.start, other.end)) {
                  return `Schedule conflict: Classroom is already taken on ${sched.day} from ${other.start} to ${other.end} by Grade ${cls.classGrade} Section ${cls.classSection}.`;
                }
              }
            }
          }
        }
      }
    }
  }
  return null;
}

/**
 * Ensure the schedule is always an array of {day, start, end, subject} objects.
 * Accepts a string or array and returns a normalized array.
 */
export function normalizeSchedule(schedule) {
  if (Array.isArray(schedule)) {
    // Ensure each schedule item has only day, start, end, and subject fields
    return schedule.map(item => ({
      day: item.day,
      start: item.start,
      end: item.end,
      subject: item.subject || ''
    }));
  }
  // If it's a string, return an empty array (or parse if you have a format)
  return [];
}

/**
 * Get all available time slots within a shift for a specific day.
 * @param {string} grade - Grade level
 * @param {string} day - Day of the week
 * @param {number} duration - Duration in minutes (default: 60)
 * @returns {Array} - Array of available time slots
 */
export function getAvailableTimeSlots(grade, day, duration = 60) {
  const shift = getShiftForGrade(grade);
  if (!shift) return [];

  const slots = [];
  let currentTime = shift.startMinutes;
  
  while (currentTime + duration <= shift.endMinutes) {
    slots.push({
      start: fromMinutes(currentTime),
      end: fromMinutes(currentTime + duration),
      startMinutes: currentTime,
      endMinutes: currentTime + duration
    });
    currentTime += duration;
  }

  return slots;
}

/**
 * Format schedule for display with shift information.
 * @param {Array} schedule - Schedule array
 * @param {string} grade - Grade level
 * @returns {string} - Formatted schedule string
 */
export function formatScheduleDisplay(schedule, grade) {
  const shift = getShiftForGrade(grade);
  const shiftInfo = shift ? ` (${shift.displayName})` : '';
  
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return `No schedule set${shiftInfo}`;
  }

  const formattedSlots = schedule.map(slot => {
    const timeRange = `${slot.start} - ${slot.end}`;
    const subjectInfo = slot.subject ? ` - ${slot.subject}` : '';
    return `${slot.day} ${timeRange}${subjectInfo}`;
  });

  return formattedSlots.join(', ') + shiftInfo;
} 