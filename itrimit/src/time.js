// Pure time helpers. No state, no DOM.

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const LOCALE = 'en-NZ';

export function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / MINUTE));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
}

export function formatStopwatch(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });
}

export function formatDay(timestamp) {
  return new Date(timestamp).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatHours(ms) {
  return (ms / HOUR).toFixed(2);
}

export function startOfDay(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Monday-start week, matching most NZ pay periods. */
export function startOfWeek(timestamp) {
  const date = new Date(startOfDay(timestamp));
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return date.getTime();
}

export function isSameDay(a, b) {
  return startOfDay(a) === startOfDay(b);
}

/** "HH:MM" for <input type="time">. */
export function toTimeInput(timestamp) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Same calendar day as `timestamp`, clock set to "HH:MM". */
export function withTime(timestamp, hhmm) {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date(timestamp);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}
