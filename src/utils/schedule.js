/**
 * Schedule Management System - Utility Functions
 * 
 * This module provides comprehensive utilities for managing class schedules,
 * time validation, and shift-based scheduling for the Student Information System.
 * 
 * Key Features:
 * - Time conversion utilities (12-hour format ↔ minutes)
 * - Grade-based shift management (Morning/Afternoon shifts)
 * - Schedule validation and conflict detection
 * - Time slot generation and formatting
 * - Schedule normalization and display formatting
 * 
 * Shift System:
 * - Grades 7-8: Morning Shift (6:30 AM - 12:00 PM)
 * - Grades 9-10: Afternoon Shift (12:30 PM - 6:00 PM)
 * 
 * Time Format: All times are in 12-hour format (e.g., "8:00 AM", "2:30 PM")
 */

// Utility functions for class schedule management

/**
 * Convert a time string in 12-hour format to minutes since midnight
 * 
 * This function parses time strings like "8:00 AM" or "2:30 PM" and
 * converts them to minutes since midnight for easier comparison and calculation.
 * 
 * @param {string} time - Time string in 12-hour format (e.g., "8:00 AM", "2:30 PM")
 * @returns {number|null} - Minutes since midnight, or null if invalid format
 * 
 * Examples:
 * - "8:00 AM" → 480 minutes
 * - "2:30 PM" → 870 minutes
 * - "12:00 PM" → 720 minutes
 * - "12:00 AM" → 0 minutes
 */
export function toMinutes(time) {
  if (!time) return null;
  
  // Split time into hours and minutes
  let [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  let min = parseInt(m, 10);
  
  // Handle PM times (add 12 hours except for 12 PM)
  if (time.toLowerCase().includes('pm') && hour !== 12) hour += 12;
  
  // Handle 12 AM (convert to 0 hours)
  if (time.toLowerCase().includes('am') && hour === 12) hour = 0;
  
  return hour * 60 + min;
}

/**
 * Convert minutes since midnight to 12-hour time format string
 * 
 * This is the inverse of toMinutes() function. It converts a number
 * of minutes since midnight back to a readable time string.
 * 
 * @param {number} minutes - Minutes since midnight
 * @returns {string} - Time string in 12-hour format (e.g., "8:00 AM")
 * 
 * Examples:
 * - 480 → "8:00 AM"
 * - 870 → "2:30 PM"
 * - 720 → "12:00 PM"
 * - 0 → "12:00 AM"
 */
export function fromMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '';
  
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${displayHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Get shift information for a specific grade level
 * 
 * The school operates on a two-shift system:
 * - Morning Shift: Grades 7-8 (6:30 AM - 12:00 PM)
 * - Afternoon Shift: Grades 9-10 (12:30 PM - 6:00 PM)
 * 
 * @param {string} grade - The grade level (7, 8, 9, 10)
 * @returns {object|null} - Shift information object or null if invalid grade
 * 
 * Return object structure:
 * {
 *   name: 'morning' | 'afternoon',
 *   start: '6:30 AM' | '12:30 PM',
 *   end: '12:00 PM' | '6:00 PM',
 *   startMinutes: number,
 *   endMinutes: number,
 *   displayName: 'Morning Shift' | 'Afternoon Shift'
 * }
 */
export function getShiftForGrade(grade) {
  const gradeNum = parseInt(grade, 10);
  
  // Morning shift for grades 7-8
  if (gradeNum === 7 || gradeNum === 8) {
    return {
      name: 'morning',
      start: '6:30 AM',
      end: '12:00 PM',
      startMinutes: 390, // 6:30 AM
      endMinutes: 720,   // 12:00 PM
      displayName: 'Morning Shift'
    };
  } 
  // Afternoon shift for grades 9-10
  else if (gradeNum === 9 || gradeNum === 10) {
    return {
      name: 'afternoon',
      start: '12:30 PM',
      end: '6:00 PM',
      startMinutes: 750, // 12:30 PM
      endMinutes: 1080,  // 6:00 PM
      displayName: 'Afternoon Shift'
    };
  }
  
  // Return null for unsupported grades
  return null;
}

/**
 * Validate if a time falls within the allowed shift for a specific grade
 * 
 * This function checks if a given time is within the appropriate
 * shift hours for the specified grade level.
 * 
 * @param {string} time - Time string in 12-hour format (e.g., '8:00 AM')
 * @param {string} grade - Grade level (7, 8, 9, 10)
 * @returns {boolean} - True if time is valid for the grade's shift, false otherwise
 * 
 * Examples:
 * - isTimeInShift('8:00 AM', '7') → true (morning shift)
 * - isTimeInShift('2:00 PM', '7') → false (outside morning shift)
 * - isTimeInShift('2:00 PM', '9') → true (afternoon shift)
 */
export function isTimeInShift(time, grade) {
  const shift = getShiftForGrade(grade);
  if (!shift) return false;
  
  const timeMinutes = toMinutes(time);
  if (timeMinutes === null) return false;
  
  return timeMinutes >= shift.startMinutes && timeMinutes <= shift.endMinutes;
}

/**
 * Check if two time ranges overlap
 * 
 * This function determines if two time periods overlap with each other.
 * Used for detecting schedule conflicts when assigning classes to classrooms.
 * 
 * @param {string} startA - Start time of first period (e.g., '8:00 AM')
 * @param {string} endA - End time of first period (e.g., '9:00 AM')
 * @param {string} startB - Start time of second period (e.g., '8:30 AM')
 * @param {string} endB - End time of second period (e.g., '9:30 AM')
 * @returns {boolean} - True if periods overlap, false otherwise
 * 
 * Examples:
 * - isTimeOverlap('8:00 AM', '9:00 AM', '8:30 AM', '9:30 AM') → true
 * - isTimeOverlap('8:00 AM', '9:00 AM', '9:00 AM', '10:00 AM') → false
 * - isTimeOverlap('8:00 AM', '9:00 AM', '7:00 AM', '8:30 AM') → true
 */
export function isTimeOverlap(startA, endA, startB, endB) {
  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);
  
  // Return false if any time is invalid
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false;
  
  // Check for overlap: periods overlap if one starts before the other ends
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Validate schedule times for a specific grade level
 * 
 * This comprehensive validation function checks:
 * - All times are within the grade's shift
 * - Start times are before end times
 * - Minimum class duration (30 minutes)
 * - Required subject names
 * - Complete time slot information
 * 
 * @param {Array} schedule - Array of schedule objects with {day, start, end, subject, teacher}
 * @param {string} grade - Grade level for shift validation
 * @returns {object} - Validation result with {valid: boolean, errors: Array}
 * 
 * Example schedule array:
 * [
 *   { day: 'Monday', start: '8:00 AM', end: '9:00 AM', subject: 'Math', teacher: 'Mr. Smith' },
 *   { day: 'Tuesday', start: '8:00 AM', end: '9:00 AM', subject: 'Science', teacher: 'Ms. Johnson' }
 * ]
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
  
  // Validate each schedule slot
  for (const slot of schedule) {
    // Check for complete time information
    if (!slot.start || !slot.end) {
      errors.push(`Incomplete time slot for ${slot.day}`);
      continue;
    }

    // Check if start time is within the grade's shift
    if (!isTimeInShift(slot.start, grade)) {
      errors.push(`${slot.day} start time (${slot.start}) is outside the ${shift.displayName} (${shift.start} - ${shift.end})`);
    }

    // Check if end time is within the grade's shift
    if (!isTimeInShift(slot.end, grade)) {
      errors.push(`${slot.day} end time (${slot.end}) is outside the ${shift.displayName} (${shift.start} - ${shift.end})`);
    }

    // Check if start time is before end time
    const startMinutes = toMinutes(slot.start);
    const endMinutes = toMinutes(slot.end);
    if (startMinutes >= endMinutes) {
      errors.push(`${slot.day} start time must be before end time`);
    }

    // Check for minimum class duration (30 minutes)
    if (endMinutes - startMinutes < 30) {
      errors.push(`${slot.day} class duration must be at least 30 minutes`);
    }

    // Check for required subject name
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
 * Check if a new schedule conflicts with existing schedules for a classroom
 * 
 * This function prevents double-booking of classrooms by checking if
 * the new schedule overlaps with any existing schedules in the same
 * classroom and shift.
 * 
 * @param {Array} newSchedule - Array of {day, start, end, subject, teacher} objects
 * @param {Array} existingSchedules - Array of class objects with classroomId and schedule
 * @param {string} classroomId - The classroom being checked for conflicts
 * @param {string} grade - Grade level for shift validation
 * @param {string} [ignoreClassId] - Optional class ID to ignore (useful when editing existing class)
 * @returns {string|null} - Error message if conflict found, null if no conflicts
 * 
 * Example conflict message:
 * "Schedule conflict: Classroom is already taken on Monday from 8:00 AM to 9:00 AM by Grade 7 Section A."
 */
export function checkScheduleConflict(newSchedule, existingSchedules, classroomId, grade, ignoreClassId) {
  const shift = getShiftForGrade(grade);
  if (!shift) {
    return `Invalid grade level: ${grade}. Only grades 7-10 are supported.`;
  }

  // Check each existing class for conflicts
  for (const cls of existingSchedules) {
    // Only check classes in the same classroom (and not the class being edited)
    if (cls.classroomId === classroomId && (!ignoreClassId || cls.id !== ignoreClassId)) {
      // Check if the existing class is in the same shift
      const existingShift = getShiftForGrade(cls.classGrade);
      if (existingShift && existingShift.name === shift.name) {
        // Compare schedules for time overlaps
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
 * Normalize schedule data to ensure consistent format
 * 
 * This function ensures that schedule data is always in the correct
 * array format with the required fields, regardless of how it's stored
 * or received from the database.
 * 
 * @param {Array|string} schedule - Schedule data (array or string)
 * @returns {Array} - Normalized array of schedule objects
 * 
 * Each schedule object contains:
 * - day: Day of the week
 * - start: Start time
 * - end: End time
 * - subject: Subject name (defaults to empty string)
 */
export function normalizeSchedule(schedule) {
  if (Array.isArray(schedule)) {
    // Ensure each schedule item has only the required fields
    return schedule.map(item => ({
      day: item.day,
      start: item.start,
      end: item.end,
      subject: item.subject || ''
    }));
  }
  // If it's a string or other format, return an empty array
  return [];
}

/**
 * Get all available time slots within a shift for a specific day
 * 
 * This function generates all possible time slots of a given duration
 * within the shift hours for a specific grade. Useful for creating
 * dropdown options or checking availability.
 * 
 * @param {string} grade - Grade level
 * @param {string} day - Day of the week (not used in calculation but included for context)
 * @param {number} duration - Duration of each slot in minutes (default: 60)
 * @returns {Array} - Array of available time slot objects
 * 
 * Each slot object contains:
 * - start: Start time string
 * - end: End time string
 * - startMinutes: Start time in minutes
 * - endMinutes: End time in minutes
 */
export function getAvailableTimeSlots(grade, day, duration = 60) {
  const shift = getShiftForGrade(grade);
  if (!shift) return [];

  const slots = [];
  let currentTime = shift.startMinutes;
  
  // Generate slots until we can't fit a full duration slot
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
 * Format schedule for display with shift information
 * 
 * This function creates a human-readable string representation of
 * a schedule, including shift information for context.
 * 
 * @param {Array} schedule - Schedule array
 * @param {string} grade - Grade level for shift information
 * @returns {string} - Formatted schedule string
 * 
 * Examples:
 * - "Monday 8:00 AM - 9:00 AM - Math, Tuesday 8:00 AM - 9:00 AM - Science (Morning Shift)"
 * - "No schedule set (Afternoon Shift)"
 */
export function formatScheduleDisplay(schedule, grade) {
  const shift = getShiftForGrade(grade);
  const shiftInfo = shift ? ` (${shift.displayName})` : '';
  
  // Handle empty or invalid schedules
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return `No schedule set${shiftInfo}`;
  }

  // Format each schedule slot
  const formattedSlots = schedule.map(slot => {
    const timeRange = `${slot.start} - ${slot.end}`;
    const subjectInfo = slot.subject ? ` - ${slot.subject}` : '';
    return `${slot.day} ${timeRange}${subjectInfo}`;
  });

  // Join all slots with commas and add shift information
  return formattedSlots.join(', ') + shiftInfo;
} 