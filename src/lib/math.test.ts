/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addDays, dateKey, weekdayIndex } from './date';
import { bmi, bmiCategory, targets, tdee, whtr } from './fitness';
import { parseNum, peso } from './format';
import { generatePlan, isValidPlan, planTotals } from './planner';
import type { Expense, Profile } from './store';
import { byCategory, last7, payPeriod, totalOf } from './wallet';

const ray: Profile = { name: 'Ray', sex: 'male', age: 24, heightCm: 170, weightKg: 60, waistCm: 86, activity: 'light' };

describe('dates', () => {
  it('uses the local date, not UTC (7:30 AM in PH is still today)', () => {
    assert.equal(dateKey(new Date(2026, 9, 1, 7, 30)), '2026-10-01');
    assert.equal(dateKey(new Date(2026, 9, 1, 0, 5)), '2026-10-01');
  });

  it('adds days across month and year boundaries', () => {
    assert.equal(addDays('2026-10-31', 1), '2026-11-01');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2028-03-01', -1), '2028-02-29');
  });

  it('starts weeks on Monday', () => {
    assert.equal(weekdayIndex('2026-10-05'), 0); // Monday
    assert.equal(weekdayIndex('2026-10-01'), 3); // Thursday
    assert.equal(weekdayIndex('2026-10-04'), 6); // Sunday
  });
});

describe('fitness math', () => {
  it('computes BMI with Asia-Pacific categories', () => {
    assert.equal(bmi(ray).toFixed(1), '20.8');
    assert.equal(bmiCategory(22.9).label, 'Normal');
    assert.equal(bmiCategory(23).label, 'Overweight');
    assert.equal(bmiCategory(25).label, 'Obese');
  });

  it('computes waist-to-height', () => {
    assert.equal(whtr(ray)!.toFixed(2), '0.51');
    assert.equal(whtr({ ...ray, waistCm: null }), null);
  });

  it('sets a gentle deficit with 1.8 g/kg protein', () => {
    const t = targets(ray);
    assert.equal(t.kcal, 1870);
    assert.equal(t.protein, 108);
    // Macros add back up to the calorie target (within rounding).
    assert.ok(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.kcal) < 10);
  });

  it('never sets a deficit when underweight', () => {
    const thin = { ...ray, weightKg: 50 }; // BMI 17.3
    assert.equal(targets(thin).kcal, Math.round(tdee(thin) / 10) * 10);
  });
});

describe('meal planner', () => {
  const opts = { targets: targets(ray), budget: 200, priceFactor: 1 };

  it('stays within budget and returns a complete plan', () => {
    for (const day of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-12-25']) {
      const plan = generatePlan(day, opts);
      assert.ok(isValidPlan(plan));
      assert.ok(planTotals(plan, 1).cost <= 200, `${day} over budget`);
    }
  });

  it('gives the same plan for the same day, and changes on re-plan', () => {
    assert.deepEqual(generatePlan('2026-10-01', opts), generatePlan('2026-10-01', opts));
    const a = generatePlan('2026-10-01', opts);
    const b = generatePlan('2026-10-01', opts, Object.values(a), 1);
    assert.notDeepEqual(a, b);
  });

  it('respects a tight budget when possible', () => {
    const plan = generatePlan('2026-10-01', { ...opts, budget: 130 });
    assert.ok(planTotals(plan, 1).cost <= 130);
  });
});

describe('wallet math', () => {
  it('splits kinsenas pay periods at the 15th', () => {
    assert.deepEqual(payPeriod('2026-10-01', 'kinsenas', 18000), { start: '2026-10-01', end: '2026-10-15', days: 15, income: 9000, label: 'Oct 1–15' });
    assert.deepEqual(payPeriod('2026-10-16', 'kinsenas', 18000), { start: '2026-10-16', end: '2026-10-31', days: 16, income: 9000, label: 'Oct 16–31' });
    // Payday boundaries: the 15th closes the first half, the 16th opens the second.
    assert.equal(payPeriod('2026-10-15', 'kinsenas', 18000).end, '2026-10-15');
    assert.equal(payPeriod('2026-10-16', 'kinsenas', 18000).start, '2026-10-16');
    assert.equal(payPeriod('2026-10-31', 'kinsenas', 18000).start, '2026-10-16');
    assert.equal(payPeriod('2028-02-20', 'kinsenas', 18000).end, '2028-02-29'); // leap year
  });

  it('uses the whole month for monthly pay', () => {
    assert.deepEqual(payPeriod('2026-11-10', 'monthly', 18000), { start: '2026-11-01', end: '2026-11-30', days: 30, income: 18000, label: 'Nov 1–30' });
  });

  it('totals, groups and charts expenses', () => {
    const e = (day: string, amount: number, category: Expense['category']): Expense => ({ id: `${day}${amount}`, day, ts: 0, amount, category, note: '' });
    const list = [e('2026-10-01', 75, 'food'), e('2026-10-01', 40, 'transport'), e('2026-09-30', 100, 'food'), e('2026-09-01', 999, 'bills')];
    assert.equal(totalOf(list), 1214);
    assert.deepEqual(byCategory(list.slice(0, 3)), [
      { key: 'food', total: 175 },
      { key: 'transport', total: 40 },
    ]);
    const week = last7(list, '2026-10-01');
    assert.equal(week.length, 7);
    assert.deepEqual(week.slice(-2), [
      { day: '2026-09-30', total: 100 },
      { day: '2026-10-01', total: 115 },
    ]);
  });
});

describe('formatting', () => {
  it('formats pesos with thousands separators', () => {
    assert.equal(peso(1425), '₱1,425');
    assert.equal(peso(-75), '-₱75');
    assert.equal(peso(1234567.5, true), '₱1,234,567.50');
  });

  it('parses typed amounts', () => {
    assert.equal(parseNum('₱1,500'), 1500);
    assert.equal(parseNum(' 75.5 '), 75.5);
    assert.ok(Number.isNaN(parseNum('abc')));
  });
});
