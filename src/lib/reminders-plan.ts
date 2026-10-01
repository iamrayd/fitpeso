// Pure scheduling logic (no React Native imports) so it can be unit tested.
import { PUSHUP_GOAL } from '../data/workouts';
import { addDays, dateKey } from './date';

export type ReminderKey = 'pushups' | 'spending' | 'waist';
export type ReminderSetting = { on: boolean; hour: number; minute: number };
export type Reminders = Record<ReminderKey, ReminderSetting>;

export const DEFAULT_REMINDERS: Reminders = {
  pushups: { on: false, hour: 19, minute: 0 },
  spending: { on: false, hour: 21, minute: 0 },
  waist: { on: false, hour: 8, minute: 0 },
};

/** The waist check happens on Sundays (JS getDay() === 0). */
export const WAIST_WEEKDAY = 0;

/** How far ahead to schedule. Re-synced every time the app opens or data changes. */
export const PLAN_DAYS = 14;

export type ReminderInput = {
  reminders: Reminders;
  /** Push-ups done per day key. */
  pushups: Record<string, number>;
  /** Day keys that have at least one expense logged. */
  expenseDays: Set<string>;
  /** Most recent day a waist measurement was logged, if any. */
  lastWaistDay: string | null;
};

export type PlannedReminder = { id: string; key: ReminderKey; date: Date; title: string; body: string };

function at(base: Date, days: number, s: ReminderSetting): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days, s.hour, s.minute, 0, 0);
}

/**
 * Works out every reminder to schedule from `now` forward. Reminders are
 * "smart": a day is skipped when it's already handled (push-up goal hit,
 * spending logged, waist measured this week), so they only fire when useful.
 */
export function planReminders(now: Date, input: ReminderInput, days = PLAN_DAYS): PlannedReminder[] {
  const { reminders: r } = input;
  const out: PlannedReminder[] = [];
  for (let i = 0; i < days; i++) {
    if (r.pushups.on) {
      const date = at(now, i, r.pushups);
      const day = dateKey(date);
      const done = input.pushups[day] ?? 0;
      if (date > now && done < PUSHUP_GOAL) {
        out.push({
          id: `pushups-${day}`,
          key: 'pushups',
          date,
          title: 'Push-up time 💪',
          body: done > 0 ? `${PUSHUP_GOAL - done} to go to hit 100 today.` : `Your ${PUSHUP_GOAL} push-ups are waiting. Split them into sets.`,
        });
      }
    }
    if (r.spending.on) {
      const date = at(now, i, r.spending);
      const day = dateKey(date);
      if (date > now && !input.expenseDays.has(day)) {
        out.push({ id: `spending-${day}`, key: 'spending', date, title: 'Log today’s spending', body: 'Takes 10 seconds. Every peso counts toward your budget.' });
      }
    }
    if (r.waist.on) {
      const date = at(now, i, r.waist);
      const day = dateKey(date);
      const measuredThisWeek = input.lastWaistDay !== null && input.lastWaistDay >= addDays(day, -6);
      if (date > now && date.getDay() === WAIST_WEEKDAY && !measuredThisWeek) {
        out.push({ id: `waist-${day}`, key: 'waist', date, title: 'Weekly waist check', body: 'Measure at your belly button before eating, then log it in Me.' });
      }
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function timeText(s: Pick<ReminderSetting, 'hour' | 'minute'>): string {
  const h = s.hour % 12 || 12;
  return `${h}:${String(s.minute).padStart(2, '0')} ${s.hour < 12 ? 'AM' : 'PM'}`;
}
