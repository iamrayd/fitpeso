/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SCHEMA, migrateData, parseBackup } from './backup-validate';
import { defaultAccounts } from './money-meta';
import { DEFAULT_REMINDERS } from './reminders-plan';
import type { AppData } from './store';

// Mirrors the store's initial state (the store itself imports React Native, so it can't load in Node).
const defaults: AppData = {
  profile: null,
  body: [],
  workouts: {},
  meals: {},
  foodBudget: 200,
  priceFactor: 1,
  autoLogMeals: false,
  salary: 0,
  paySchedule: 'kinsenas',
  defaultDailyBudget: 350,
  dailyBudgets: {},
  expenses: [],
  accounts: defaultAccounts(),
  incomes: [],
  lastAccountId: null,
  transfers: [],
  reminders: DEFAULT_REMINDERS,
};

const profile = { name: 'Ray', sex: 'male', age: 24, heightCm: 170, weightKg: 60, waistCm: 86, activity: 'light' } as const;

const goodData: AppData = {
  ...defaults,
  profile,
  body: [{ day: '2026-10-01', weightKg: 60, waistCm: 86 }],
  workouts: { '2026-10-01': { done: ['thu-row'], pushups: 40 } },
  expenses: [{ id: 'e1', day: '2026-10-01', ts: 1, amount: 75, category: 'food', note: 'Eggs', accountId: 'cash' }],
  incomes: [{ id: 'i1', day: '2026-10-01', ts: 2, amount: 500, accountId: 'gcash', note: 'Salary' }],
  accounts: [
    { id: 'cash', name: 'Cash', icon: 'cash-outline', base: 1000 },
    { id: 'gcash', name: 'GCash', icon: 'phone-portrait-outline', base: 0 },
  ],
  salary: 18000,
  lastAccountId: 'cash',
  transfers: [{ id: 't1', day: '2026-10-01', ts: 3, amount: 200, fromId: 'cash', toId: 'gcash', note: 'Cash-in' }],
  reminders: { ...DEFAULT_REMINDERS, pushups: { on: true, hour: 19, minute: 30 } },
};

const file = (data: unknown, schema = SCHEMA, app = 'fitpeso') => JSON.stringify({ app, schema, exportedAt: '2026-10-01T00:00:00Z', data });

describe('parseBackup', () => {
  it('round-trips a valid backup unchanged', () => {
    const r = parseBackup(file(goodData), defaults);
    assert.ok(r.ok);
    assert.deepEqual(r.data, goodData);
    assert.equal(r.skipped, 0);
  });

  it('rejects text that is not JSON', () => {
    const r = parseBackup('not json {', defaults);
    assert.equal(r.ok, false);
  });

  it('rejects files from other apps', () => {
    assert.equal(parseBackup(file(goodData, SCHEMA, 'otherapp'), defaults).ok, false);
    assert.equal(parseBackup(JSON.stringify({ hello: 'world' }), defaults).ok, false);
  });

  it('rejects backups from a newer app version', () => {
    const r = parseBackup(file(goodData, SCHEMA + 1), defaults);
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /newer version/);
  });

  it('rejects a damaged profile instead of guessing', () => {
    assert.equal(parseBackup(file({ ...goodData, profile: { ...profile, heightCm: 'tall' } }), defaults).ok, false);
    assert.equal(parseBackup(file({ ...goodData, profile: { ...profile, age: 5 } }), defaults).ok, false);
  });

  it('drops damaged entries, keeps good ones, and counts what it skipped', () => {
    const r = parseBackup(
      file({
        ...goodData,
        expenses: [
          goodData.expenses[0],
          { id: 'bad1', day: 'yesterday', ts: 1, amount: 10, category: 'food', note: '' },
          { id: 'bad2', day: '2026-10-01', ts: 1, amount: -5, category: 'food', note: '' },
          'garbage',
        ],
      }),
      defaults,
    );
    assert.ok(r.ok);
    assert.equal(r.data.expenses.length, 1);
    assert.equal(r.skipped, 3);
  });

  it('repairs fields it can safely repair', () => {
    const r = parseBackup(
      file({
        ...goodData,
        expenses: [{ ...goodData.expenses[0], category: 'crypto' }],
        accounts: [{ id: 'x', name: 'Maya', icon: 'rocket', base: 5 }],
        lastAccountId: 'deleted-wallet',
        paySchedule: 'weekly',
        foodBudget: 1,
      }),
      defaults,
    );
    assert.ok(r.ok);
    assert.equal(r.data.expenses[0].category, 'other');
    assert.equal(r.data.accounts[0].icon, 'wallet-outline');
    assert.equal(r.data.lastAccountId, null);
    assert.equal(r.data.paySchedule, 'kinsenas');
    assert.equal(r.data.foodBudget, 200);
  });

  it('falls back to the default wallets when none are valid', () => {
    const r = parseBackup(file({ ...goodData, accounts: [] }), defaults);
    assert.ok(r.ok);
    assert.deepEqual(r.data.accounts.map((a) => a.id), ['cash', 'gcash', 'bank']);
  });

  it('upgrades a version 1 backup (before wallets existed)', () => {
    const { accounts: _a, incomes: _i, lastAccountId: _l, transfers: _t, reminders: _r, ...v1 } = goodData;
    const r = parseBackup(file(v1, 1), defaults);
    assert.ok(r.ok);
    assert.deepEqual(r.data.accounts, defaultAccounts());
    assert.deepEqual(r.data.incomes, []);
    assert.deepEqual(r.data.transfers, []);
    assert.deepEqual(r.data.reminders, DEFAULT_REMINDERS);
    assert.equal(r.data.expenses.length, 1);
  });

  it('upgrades a version 2 backup (before transfers and reminders)', () => {
    const { transfers: _t, reminders: _r, ...v2 } = goodData;
    const r = parseBackup(file(v2, 2), defaults);
    assert.ok(r.ok);
    assert.deepEqual(r.data.accounts, goodData.accounts);
    assert.deepEqual(r.data.transfers, []);
    assert.deepEqual(r.data.reminders, DEFAULT_REMINDERS);
  });

  it('drops transfers to the same wallet or with bad amounts', () => {
    const t = goodData.transfers[0];
    const r = parseBackup(file({ ...goodData, transfers: [t, { ...t, id: 't2', toId: 'cash' }, { ...t, id: 't3', amount: 0 }] }), defaults);
    assert.ok(r.ok);
    assert.deepEqual(r.data.transfers.map((x) => x.id), ['t1']);
    assert.equal(r.skipped, 2);
  });

  it('resets invalid reminder times to the defaults', () => {
    const r = parseBackup(file({ ...goodData, reminders: { pushups: { on: true, hour: 25, minute: 0 }, spending: 'yes' } }), defaults);
    assert.ok(r.ok);
    assert.deepEqual(r.data.reminders, DEFAULT_REMINDERS);
  });
});

describe('migrateData', () => {
  it('adds what each version introduced, and leaves current data alone', () => {
    assert.deepEqual(migrateData({ salary: 1 }, 1), { salary: 1, accounts: defaultAccounts(), incomes: [], lastAccountId: null, transfers: [], reminders: DEFAULT_REMINDERS });
    assert.deepEqual(migrateData({ salary: 1, accounts: [] }, 2), { salary: 1, accounts: [], transfers: [], reminders: DEFAULT_REMINDERS });
    assert.deepEqual(migrateData({ salary: 1 }, SCHEMA), { salary: 1 });
  });

  it('survives empty storage', () => {
    assert.deepEqual(migrateData(undefined, SCHEMA), {});
  });
});
