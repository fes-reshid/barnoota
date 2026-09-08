'use strict';

/**
 * Recurring "internet off" windows — e.g. a school-night bedtime — with a
 * separate start/end time per day of the week, since a parent's bedtime for
 * Friday night is rarely the same as for a school night.
 *
 * Shape: { enabled, perDay: { "0": {enabled, startTime, endTime}, ..., "6": {...} } }
 *   - perDay is keyed by day-of-week (0=Sun..6=Sat) — the day the window
 *     *starts* on. A window that crosses midnight (e.g. 22:00-07:00) is
 *     understood as starting the evening of that day and ending the
 *     following morning — so perDay["0"] = 22:00-07:00 means "Sunday night
 *     into Monday morning", not "blocked all day Monday".
 *   - Only days present in perDay (and enabled) are ever blocked; a day
 *     that's missing or has enabled:false is never blocked, regardless of
 *     the top-level `enabled` flag.
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

function isValidDayWindow(window) {
  if (!window || typeof window !== 'object') return false;
  if (typeof window.enabled !== 'boolean') return false;
  if (!window.enabled) return true;
  const start = parseHHMM(window.startTime);
  const end = parseHHMM(window.endTime);
  return start !== null && end !== null && start !== end;
}

function isValidSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return false;
  if (!schedule.perDay || typeof schedule.perDay !== 'object' || Array.isArray(schedule.perDay)) return false;
  const keys = Object.keys(schedule.perDay);
  if (keys.length === 0) return false;
  return keys.every((key) => {
    const day = Number(key);
    return Number.isInteger(day) && day >= 0 && day <= 6 && isValidDayWindow(schedule.perDay[key]);
  });
}

/** True if `now` falls inside one of the schedule's enabled per-day windows. */
function isWithinSchedule(schedule, now = new Date()) {
  if (!schedule || !schedule.enabled || !isValidSchedule(schedule)) return false;

  const today = now.getDay();
  const yesterday = (today + 6) % 7;
  const minutes = now.getHours() * 60 + now.getMinutes();

  const todayWindow = schedule.perDay[today];
  if (todayWindow && todayWindow.enabled) {
    const start = parseHHMM(todayWindow.startTime);
    const end = parseHHMM(todayWindow.endTime);
    if (start < end) {
      if (minutes >= start && minutes < end) return true;
    } else if (minutes >= start) {
      // Crosses midnight: the evening half belongs to today's window.
      return true;
    }
  }

  // The early-morning half of a window that crossed midnight from yesterday.
  const yesterdayWindow = schedule.perDay[yesterday];
  if (yesterdayWindow && yesterdayWindow.enabled) {
    const start = parseHHMM(yesterdayWindow.startTime);
    const end = parseHHMM(yesterdayWindow.endTime);
    if (start >= end && minutes < end) return true;
  }

  return false;
}

/** For status display: minutes until the current active window ends, if one is active. */
function minutesUntilScheduleEnds(schedule, now = new Date()) {
  if (!isWithinSchedule(schedule, now)) return null;

  const today = now.getDay();
  const yesterday = (today + 6) % 7;
  const minutes = now.getHours() * 60 + now.getMinutes();

  const todayWindow = schedule.perDay[today];
  if (todayWindow && todayWindow.enabled) {
    const start = parseHHMM(todayWindow.startTime);
    const end = parseHHMM(todayWindow.endTime);
    if (start < end && minutes >= start && minutes < end) return end - minutes;
    if (start >= end && minutes >= start) return 24 * 60 - minutes + end;
  }

  const yesterdayWindow = schedule.perDay[yesterday];
  if (yesterdayWindow && yesterdayWindow.enabled) {
    const start = parseHHMM(yesterdayWindow.startTime);
    const end = parseHHMM(yesterdayWindow.endTime);
    if (start >= end && minutes < end) return end - minutes;
  }

  return null;
}

/** "HH:MM" clock time the currently-active window ends at, or null if none is active. */
function currentWindowEndTime(schedule, now = new Date()) {
  if (!isWithinSchedule(schedule, now)) return null;

  const today = now.getDay();
  const yesterday = (today + 6) % 7;
  const minutes = now.getHours() * 60 + now.getMinutes();

  const todayWindow = schedule.perDay[today];
  if (todayWindow && todayWindow.enabled) {
    const start = parseHHMM(todayWindow.startTime);
    const end = parseHHMM(todayWindow.endTime);
    if ((start < end && minutes >= start && minutes < end) || (start >= end && minutes >= start)) {
      return todayWindow.endTime;
    }
  }

  const yesterdayWindow = schedule.perDay[yesterday];
  if (yesterdayWindow && yesterdayWindow.enabled) {
    const start = parseHHMM(yesterdayWindow.startTime);
    const end = parseHHMM(yesterdayWindow.endTime);
    if (start >= end && minutes < end) return yesterdayWindow.endTime;
  }

  return null;
}

module.exports = {
  parseHHMM,
  isValidDayWindow,
  isValidSchedule,
  isWithinSchedule,
  minutesUntilScheduleEnds,
  currentWindowEndTime,
};
