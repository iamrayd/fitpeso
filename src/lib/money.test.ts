/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { balanceOf, baseFor } from './ledger';
import { DEFAULT_REMINDERS, planReminders, timeText, type ReminderInput } from './reminders-plan';
import type { Expense, Income, Ledger, Transfer } from './store';

const exp = (amount: number, accountId?: string): Expense => ({ id: `e${amount}${accountId}`, day: '2026-10-01', ts: 0, amount, category: 'food', note: '', ...(accountId ? { accountId } : {}) });
const inc = (amount: number, accountId: string): Income => ({ id: `i${amount}`, day: '2026-10-01', ts: 0, amount, accountId, note: '' });
const xfer = (amount: number, fromId: string, toId: string): Transfer => ({ id: `t${amount}`, day: '2026-10-01', ts: 0, amount, fromId, toId, note: '' });

describe('wallet balances', () => {
  const cash = { id: 'cash', base: 1000 };
  const gcash = { id: 'gcash', base: 0 };
  const ledger: Ledger = {
    expenses: [exp(75, 'cash'), exp(40), exp(30, 'gcash')], // the 40 has no wallet (logged before wallets existed)
    incomes: [inc(500, 'gcash')],
    transfers: [xfer(200, 'cash', 'gcash')],
  };

  it('adds money in, subtracts expenses, and moves transfers between wallets', () => {
    assert.equal(balanceOf(cash, ledger), 1000 - 75 - 200);
    assert.equal(balanceOf(gcash, ledger), 500 - 30 + 200);
  });

  it('transfers never change the total across wallets', () => {
    const noXfer = { ...ledger, transfers: [] };
    assert.equal(balanceOf(cash, ledger) + balanceOf(gcash, ledger), balanceOf(cash, noXfer) + balanceOf(gcash, noXfer));
  });

  it('expenses without a wallet do not affect any balance', () => {
    const without = { ...ledger, expenses: ledger.expenses.filter((e) => e.accountId) };
    assert.equal(balanceOf(cash, ledger), balanceOf(cash, without));
  });

  it('setting a balance by hand lands exactly on the typed amount', () => {
    const base = baseFor('cash', 2500, ledger);
    assert.equal(balanceOf({ id: 'cash', base }, ledger), 2500);
    // ...and deleting an entry afterwards still adjusts it correctly.
    const afterDelete = { ...ledger, expenses: ledger.expenses.filter((e) => e.amount !== 75) };
    assert.equal(balanceOf({ id: 'cash', base }, afterDelete), 2575);
  });

  it('avoids floating-point noise', () => {
    assert.equal(balanceOf({ id: 'a', base: 0.1 }, { expenses: [], incomes: [inc(0.2, 'a')], transfers: [] }), 0.3);
  });
});

describe('reminder planning', () => {
  // Thursday 1 Oct 2026, 10:00 AM local time.
  const now = new Date(2026, 9, 1, 10, 0);
  const allOn = {
    pushups: { on: true, hour: 19, minute: 0 },
    spending: { on: true, hour: 21, minute: 0 },
    waist: { on: true, hour: 8, minute: 0 },
  };
  const base: ReminderInput = { reminders: allOn, pushups: {}, expenseDays: new Set(), lastWaistDay: null };
  const ids = (input: ReminderInput, days = 7) => planReminders(now, input, days).map((r) => r.id);

  it('schedules nothing while every reminder is off', () => {
    assert.deepEqual(planReminders(now, { ...base, reminders: DEFAULT_REMINDERS }), []);
  });

  it('schedules daily reminders at the chosen time, starting today', () => {
    const plan = planReminders(now, base, 2);
    const first = plan.find((r) => r.id === 'pushups-2026-10-01')!;
    assert.equal(first.date.getHours(), 19);
    assert.ok(ids(base, 2).includes('spending-2026-10-02'));
  });

  it('never schedules a time that has already passed', () => {
    const late = new Date(2026, 9, 1, 22, 0);
    const plan = planReminders(late, base, 1);
    assert.deepEqual(plan, []);
    assert.ok(planReminders(late, base, 7).every((r) => r.date > late));
  });

  it('skips today’s push-up reminder once you hit 100, and counts down before that', () => {
    assert.ok(!ids({ ...base, pushups: { '2026-10-01': 100 } }).includes('pushups-2026-10-01'));
    assert.ok(ids({ ...base, pushups: { '2026-10-01': 100 } }).includes('pushups-2026-10-02'));
    const partial = planReminders(now, { ...base, pushups: { '2026-10-01': 60 } }, 1).find((r) => r.key === 'pushups')!;
    assert.match(partial.body, /40 to go/);
  });

  it('skips the spending reminder on days you already logged something', () => {
    const plan = ids({ ...base, expenseDays: new Set(['2026-10-01']) });
    assert.ok(!plan.includes('spending-2026-10-01'));
    assert.ok(plan.includes('spending-2026-10-02'));
  });

  it('only reminds about the waist on Sundays, and not if you measured that week', () => {
    assert.deepEqual(ids(base).filter((id) => id.startsWith('waist')), ['waist-2026-10-04']);
    assert.ok(!ids({ ...base, lastWaistDay: '2026-09-29' }).includes('waist-2026-10-04')); // measured Tuesday
    assert.ok(ids({ ...base, lastWaistDay: '2026-09-27' }).includes('waist-2026-10-04')); // last Sunday doesn't count
  });

  it('returns reminders in time order with unique ids', () => {
    const plan = planReminders(now, base, 14);
    assert.equal(new Set(plan.map((r) => r.id)).size, plan.length);
    for (let i = 1; i < plan.length; i++) assert.ok(plan[i].date >= plan[i - 1].date);
  });

  it('formats times for display', () => {
    assert.equal(timeText({ hour: 19, minute: 5 }), '7:05 PM');
    assert.equal(timeText({ hour: 0, minute: 0 }), '12:00 AM');
    assert.equal(timeText({ hour: 12, minute: 30 }), '12:30 PM');
  });
});
