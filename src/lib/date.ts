// All dates are stored as local "YYYY-MM-DD" keys. Never use toISOString() for
// this: it converts to UTC, which in the Philippines (UTC+8) gives yesterday's
// date for anything before 8 AM.

const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function monthKey(key: string): string {
  return key.slice(0, 7);
}

export function daysInMonth(key: string): number {
  const d = fromKey(key);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 0 = Monday … 6 = Sunday (workout weeks start on Monday). */
export function weekdayIndex(key: string): number {
  return (fromKey(key).getDay() + 6) % 7;
}

export function weekdayName(key: string): string {
  return WEEKDAYS[fromKey(key).getDay()];
}

export function prettyDate(key: string): string {
  const d = fromKey(key);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function monthLabel(key: string): string {
  const d = fromKey(key);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function relativeDay(key: string, today: string): string {
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  if (key === addDays(today, 1)) return 'Tomorrow';
  return prettyDate(key);
}

export function timeLabel(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Maayong buntag';
  if (h < 18) return 'Maayong hapon';
  return 'Maayong gabii';
}
