import { addDays, daysInMonth, fromKey } from './date';
import { CATEGORIES, type Category } from './money-meta';
import type { Expense, PaySchedule } from './store';

export type Period = { start: string; end: string; days: number; income: number; label: string };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * The pay period containing `day`. Kinsenas (paid on the 15th and 30th) splits
 * the month into 1–15 and 16–end; monthly uses the whole month.
 */
export function payPeriod(day: string, schedule: PaySchedule, monthlySalary: number): Period {
  const d = fromKey(day);
  const ym = day.slice(0, 8); // "YYYY-MM-"
  const last = daysInMonth(day);
  const pad = (n: number) => String(n).padStart(2, '0');
  let from = 1;
  let to = last;
  if (schedule === 'kinsenas') {
    if (d.getDate() <= 15) to = 15;
    else from = 16;
  }
  const mon = MONTHS[d.getMonth()];
  return {
    start: ym + pad(from),
    end: ym + pad(to),
    days: to - from + 1,
    income: schedule === 'kinsenas' ? monthlySalary / 2 : monthlySalary,
    label: `${mon} ${from}–${to}`,
  };
}

export function inRange(day: string, start: string, end: string): boolean {
  return day >= start && day <= end;
}

export function totalOf(list: Expense[]): number {
  return list.reduce((a, e) => a + e.amount, 0);
}

export function byCategory(list: Expense[]): { key: Category; total: number }[] {
  const map = new Map<Category, number>();
  for (const e of list) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return [...map.entries()]
    .map(([key, total]) => ({ key, total }))
    .filter((c) => c.key in CATEGORIES)
    .sort((a, b) => b.total - a.total);
}

/** Totals for the 7 days ending on `day`, oldest first. */
export function last7(list: Expense[], day: string): { day: string; total: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const k = addDays(day, i - 6);
    return { day: k, total: totalOf(list.filter((e) => e.day === k)) };
  });
}
