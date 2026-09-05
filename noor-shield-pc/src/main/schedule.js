'use strict';

/**
 * A single recurring "internet off" window — e.g. a school-night bedtime.
 * Deliberately just one window for now (not a list): simple to reason about,
 * simple to show status for, and covers the common case ("no internet
 * 10pm-7am on school nights") without the day-picker/overlap complexity a
 * general recurring-events system would need.
 *
 * Shape: { enabled, days, startTime, endTime }
 *   - days: array of 0-6 (Sun-Sat) — which day the window *starts* on. A
 *     window that crosses midnight (e.g. 22:00-07:00) is understood as
 *     starting the evening of a listed day and ending the following
 *     morning — so days:[0] with 22:00-07:00 means "Sunday night into
 *     Monday morning", not "blocked all day Monday".
 *   - startTime/endTime: "HH:MM" 24-hour, in the PC's local time.
 */

function parseHHMM(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function isValidSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return false;
  if (!Array.isArray(schedule.days) || schedule.days.length === 0) return false;
  if (!schedule.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return false;
  const start = parseHHMM(schedule.startTime);
  const end = parseHHMM(schedule.endTime);
  return start !== null && end !== null && start !== end;
}

/** True if `now` falls inside the schedule's window. Disabled/invalid schedules never match. */
function isWithinSchedule(schedule, now = new Date()) {
  if (!schedule || !schedule.enabled || !isValidSchedule(schedule)) return false;

  const start = parseHHMM(schedule.startTime);
  const end = parseHHMM(schedule.endTime);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = now.getDay();

  if (start < end) {
    return schedule.days.includes(today) && minutes >= start && minutes < end;
  }

  // Crosses midnight: the "after start, before midnight" half belongs to
  // today's window; the "after midnight, before end" half belongs to
  // yesterday's window.
  if (minutes >= start) return schedule.days.includes(today);
  if (minutes < end) return schedule.days.includes((today + 6) % 7);
  return false;
}

/** For status display: minutes since midnight until the current (or next) window ends, if active. */
function minutesUntilScheduleEnds(schedule, now = new Date()) {
  if (!isWithinSchedule(schedule, now)) return null;
  const end = parseHHMM(schedule.endTime);
  const start = parseHHMM(schedule.startTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (start < end) return end - nowMinutes;
  // Crossing midnight: if we're past start (evening side), end is tomorrow.
  return nowMinutes >= start ? 24 * 60 - nowMinutes + end : end - nowMinutes;
}

module.exports = { parseHHMM, isValidSchedule, isWithinSchedule, minutesUntilScheduleEnds };
