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
 * Check if a new schedule conflicts with any existing schedules for a classroom.
 * @param {Array} newSchedule - Array of {day, start, end}
 * @param {Array} existingSchedules - Array of class objects with classroomId and schedule
 * @param {string} classroomId - The classroom being checked
 * @param {string} [ignoreClassId] - Optional class ID to ignore (for editing)
 * @returns {string|null} - Returns error message if conflict, otherwise null
 */
export function checkScheduleConflict(newSchedule, existingSchedules, classroomId, ignoreClassId) {
  for (const cls of existingSchedules) {
    if (cls.classroomId === classroomId && (!ignoreClassId || cls.id !== ignoreClassId)) {
      if (Array.isArray(cls.schedule)) {
        for (const sched of newSchedule) {
          for (const other of cls.schedule) {
            if (sched.day === other.day) {
              if (isTimeOverlap(sched.start, sched.end, other.start, other.end)) {
                return `Schedule conflict: Classroom is already taken on ${sched.day} from ${other.start} to ${other.end}.`;
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
 * Ensure the schedule is always an array of {day, start, end} objects.
 * Accepts a string or array and returns a normalized array.
 */
export function normalizeSchedule(schedule) {
  if (Array.isArray(schedule)) return schedule;
  // If it's a string, return an empty array (or parse if you have a format)
  return [];
} 