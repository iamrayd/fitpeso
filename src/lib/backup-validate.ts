// Pure functions (no React Native imports) so they can be tested in Node.
import type { AppData } from './store';
import { ACCOUNT_ICONS, CATEGORIES, defaultAccounts } from './money-meta';
import { DEFAULT_REMINDERS, type ReminderKey } from './reminders-plan';

/** Version of the saved-data shape. Bump it and extend migrateData() when the shape changes. */
export const SCHEMA = 3;

export type BackupFile = { app: 'fitpeso'; schema: number; exportedAt: string; data: AppData };

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];

/** Brings older saved data up to the current shape. */
export function migrateData(persisted: unknown, version: number): Rec {
  const old: Rec = isObj(persisted) ? { ...persisted } : {};
  if (version < 2) {
    // v2 added wallets. Older expenses keep no wallet, so balances start clean.
    old.accounts = defaultAccounts();
    old.incomes = [];
    old.lastAccountId = null;
  }
  if (version < 3) {
    // v3 added wallet transfers and reminders (off until you turn them on).
    old.transfers = [];
    old.reminders = DEFAULT_REMINDERS;
  }
  return old;
}

export type ParseResult = { ok: true; data: AppData; skipped: number } | { ok: false; error: string };

/**
 * Validates a backup file's text. Rejects anything that isn't a FitPeso backup
 * or comes from a newer app version. Damaged individual entries are dropped
 * (and counted) rather than failing the whole restore; a damaged profile fails it.
 */
export function parseBackup(text: string, defaults: AppData): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file isn’t a valid backup.' };
  }
  if (!isObj(json) || json.app !== 'fitpeso' || !isObj(json.data)) return { ok: false, error: 'This isn’t a FitPeso backup.' };
  const schema = isNum(json.schema) ? json.schema : 0;
  if (schema > SCHEMA) return { ok: false, error: 'This backup is from a newer version of FitPeso. Update the app first.' };

  const d = migrateData(json.data, schema);
  let skipped = 0;
  const keep = <T,>(list: unknown, check: (x: Rec) => T | null): T[] => {
    if (!Array.isArray(list)) return [];
    const out: T[] = [];
    for (const x of list) {
      const v = isObj(x) ? check(x) : null;
      if (v) out.push(v);
      else skipped++;
    }
    return out;
  };

  // Profile
  let profile: AppData['profile'] = null;
  if (d.profile !== null && d.profile !== undefined) {
    const p = d.profile;
    const ok =
      isObj(p) &&
      isStr(p.name) &&
      (p.sex === 'male' || p.sex === 'female') &&
      isNum(p.age) && p.age >= 13 && p.age <= 90 &&
      isNum(p.heightCm) && p.heightCm >= 120 && p.heightCm <= 230 &&
      isNum(p.weightKg) && p.weightKg >= 30 && p.weightKg <= 250 &&
      (p.waistCm === null || (isNum(p.waistCm) && p.waistCm >= 40 && p.waistCm <= 200)) &&
      (p.activity === 'sedentary' || p.activity === 'light' || p.activity === 'moderate');
    if (!ok) return { ok: false, error: 'The profile in this backup is damaged.' };
    profile = p as AppData['profile'];
  }

  const body = keep(d.body, (b) =>
    isStr(b.day) && DAY.test(b.day) && isNum(b.weightKg) && (b.waistCm === null || isNum(b.waistCm))
      ? { day: b.day, weightKg: b.weightKg, waistCm: b.waistCm as number | null }
      : null,
  );

  const workouts: AppData['workouts'] = {};
  if (isObj(d.workouts))
    for (const [day, w] of Object.entries(d.workouts)) {
      if (DAY.test(day) && isObj(w) && Array.isArray(w.done) && isNum(w.pushups)) workouts[day] = { done: w.done.filter(isStr), pushups: Math.max(0, w.pushups) };
      else skipped++;
    }

  const meals: AppData['meals'] = {};
  if (isObj(d.meals))
    for (const [day, m] of Object.entries(d.meals)) {
      if (!DAY.test(day) || !isObj(m) || !isObj(m.plan)) {
        skipped++;
        continue;
      }
      const plan = Object.fromEntries(SLOTS.map((s) => [s, isStr((m.plan as Rec)[s]) ? (m.plan as Rec)[s] : ''])) as AppData['meals'][string]['plan'];
      const eaten = (Array.isArray(m.eaten) ? m.eaten : []).filter((s): s is AppData['meals'][string]['eaten'][number] => SLOTS.includes(s as string));
      const extras = keep(m.extras, (x) =>
        isStr(x.id) && isStr(x.name) && isNum(x.kcal) && isNum(x.protein) && isNum(x.carbs) && isNum(x.fat) && isNum(x.cost)
          ? { id: x.id, name: x.name, kcal: x.kcal, protein: x.protein, carbs: x.carbs, fat: x.fat, cost: x.cost }
          : null,
      );
      meals[day] = { plan, eaten, extras };
    }

  const expenses = keep(d.expenses, (e) =>
    isStr(e.id) && isStr(e.day) && DAY.test(e.day) && isNum(e.ts) && isNum(e.amount) && e.amount > 0
      ? {
          id: e.id,
          day: e.day,
          ts: e.ts,
          amount: e.amount,
          category: (isStr(e.category) && e.category in CATEGORIES ? e.category : 'other') as keyof typeof CATEGORIES,
          note: isStr(e.note) ? e.note : '',
          ...(isStr(e.mealSlot) && SLOTS.includes(e.mealSlot) ? { mealSlot: e.mealSlot as AppData['meals'][string]['eaten'][number] } : {}),
          ...(isStr(e.accountId) ? { accountId: e.accountId } : {}),
        }
      : null,
  );

  const incomes = keep(d.incomes, (i) =>
    isStr(i.id) && isStr(i.day) && DAY.test(i.day) && isNum(i.ts) && isNum(i.amount) && i.amount > 0 && isStr(i.accountId)
      ? { id: i.id, day: i.day, ts: i.ts, amount: i.amount, accountId: i.accountId, note: isStr(i.note) ? i.note : '' }
      : null,
  );

  let accounts = keep(d.accounts, (a) =>
    isStr(a.id) && isStr(a.name) && isNum(a.base)
      ? { id: a.id, name: a.name, base: a.base, icon: (ACCOUNT_ICONS as readonly string[]).includes(a.icon as string) ? (a.icon as AppData['accounts'][number]['icon']) : 'wallet-outline' }
      : null,
  );
  if (!accounts.length) accounts = defaultAccounts();

  // Transfers touching a deleted wallet are kept, like expenses; they just stop affecting that balance.
  const transfers = keep(d.transfers, (t) =>
    isStr(t.id) && isStr(t.day) && DAY.test(t.day) && isNum(t.ts) && isNum(t.amount) && t.amount > 0 && isStr(t.fromId) && isStr(t.toId) && t.fromId !== t.toId
      ? { id: t.id, day: t.day, ts: t.ts, amount: t.amount, fromId: t.fromId, toId: t.toId, note: isStr(t.note) ? t.note : '' }
      : null,
  );

  const reminders = { ...DEFAULT_REMINDERS };
  if (isObj(d.reminders))
    for (const key of Object.keys(DEFAULT_REMINDERS) as ReminderKey[]) {
      const r = (d.reminders as Rec)[key];
      if (isObj(r) && typeof r.on === 'boolean' && isNum(r.hour) && r.hour >= 0 && r.hour <= 23 && isNum(r.minute) && r.minute >= 0 && r.minute <= 59)
        reminders[key] = { on: r.on, hour: Math.floor(r.hour), minute: Math.floor(r.minute) };
    }

  const dailyBudgets: Record<string, number> = {};
  if (isObj(d.dailyBudgets)) for (const [day, v] of Object.entries(d.dailyBudgets)) if (DAY.test(day) && isNum(v) && v >= 0) dailyBudgets[day] = v;

  const num = (v: unknown, fallback: number, min: number, max: number) => (isNum(v) && v >= min && v <= max ? v : fallback);

  return {
    ok: true,
    skipped,
    data: {
      ...defaults,
      profile,
      body,
      workouts,
      meals,
      expenses,
      incomes,
      accounts,
      transfers,
      reminders,
      dailyBudgets,
      foodBudget: num(d.foodBudget, defaults.foodBudget, 80, 100_000),
      priceFactor: num(d.priceFactor, defaults.priceFactor, 0.5, 2),
      autoLogMeals: typeof d.autoLogMeals === 'boolean' ? d.autoLogMeals : defaults.autoLogMeals,
      salary: num(d.salary, defaults.salary, 0, 100_000_000),
      paySchedule: d.paySchedule === 'monthly' || d.paySchedule === 'kinsenas' ? d.paySchedule : defaults.paySchedule,
      defaultDailyBudget: num(d.defaultDailyBudget, defaults.defaultDailyBudget, 0, 10_000_000),
      lastAccountId: isStr(d.lastAccountId) && accounts.some((a) => a.id === d.lastAccountId) ? d.lastAccountId : null,
    },
  };
}
