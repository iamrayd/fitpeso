import { MEALS, MEALS_BY_ID, SLOTS, mealCost, mealMacros, type Meal, type Slot } from '@/data/foods';
import type { Macros } from './fitness';

type Opts = { targets: Macros; budget: number; priceFactor: number };

/** Small deterministic RNG so a given day always gets the same suggestions. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

const bySlot = (slot: Slot) => MEALS.filter((m) => m.slot === slot);

/**
 * Lower is better. Staying within budget matters most, then hitting protein
 * (the key to losing belly fat without losing muscle), then calories.
 */
function score(total: Macros, cost: number, { targets, budget }: Opts): number {
  const over = Math.max(0, cost - budget);
  const proteinGap = Math.max(0, targets.protein - total.protein) / Math.max(1, targets.protein);
  const kcalGap = Math.abs(targets.kcal - total.kcal) / Math.max(1, targets.kcal);
  return over * 10 + proteinGap * 4 + kcalGap * 1.5;
}

/**
 * Picks breakfast, lunch, snack and dinner for a day. Every combination is
 * scored (only ~2,000), then one of the best few is chosen at random (seeded by
 * the date) so you don't eat the same thing every day. Meals from yesterday are
 * nudged down for variety.
 */
export function generatePlan(day: string, opts: Opts, avoid: string[] = [], reroll = 0): Record<Slot, string> {
  const rand = seeded(`${day}#${reroll}`);
  const [B, L, S, D] = SLOTS.map((s) => bySlot(s.key));
  const info = new Map(MEALS.map((m) => [m.id, { cost: mealCost(m, opts.priceFactor), mac: mealMacros(m) }]));
  const ranked: { ids: [string, string, string, string]; s: number }[] = [];

  for (const b of B) for (const l of L) for (const s of S) for (const d of D) {
    const ids = [b.id, l.id, s.id, d.id] as [string, string, string, string];
    let cost = 0;
    const tot = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    for (const id of ids) {
      const i = info.get(id)!;
      cost += i.cost;
      tot.kcal += i.mac.kcal;
      tot.protein += i.mac.protein;
      tot.carbs += i.mac.carbs;
      tot.fat += i.mac.fat;
    }
    const repeats = ids.filter((id) => avoid.includes(id)).length;
    ranked.push({ ids, s: score(tot, cost, opts) + repeats * 0.15 + rand() * 0.12 });
  }
  ranked.sort((a, b) => a.s - b.s);
  const pick = ranked[Math.floor(rand() * Math.min(8, ranked.length))].ids;
  return { breakfast: pick[0], lunch: pick[1], snack: pick[2], dinner: pick[3] };
}

/** Other meals for one slot, best fit first, given the rest of the day's plan. */
export function alternatives(plan: Record<Slot, string>, slot: Slot, opts: Opts): { meal: Meal; cost: number; fits: boolean }[] {
  const others = SLOTS.filter((s) => s.key !== slot).map((s) => MEALS_BY_ID[plan[s.key]]).filter(Boolean);
  const baseCost = others.reduce((a, m) => a + mealCost(m, opts.priceFactor), 0);
  const baseMac = others.map(mealMacros);
  return bySlot(slot)
    .map((meal) => {
      const cost = mealCost(meal, opts.priceFactor);
      const mac = mealMacros(meal);
      const tot = [...baseMac, mac].reduce(
        (a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      );
      return { meal, cost, fits: baseCost + cost <= opts.budget, s: score(tot, baseCost + cost, opts) };
    })
    .sort((a, b) => a.s - b.s)
    .map(({ meal, cost, fits }) => ({ meal, cost, fits }));
}

export function planTotals(plan: Record<Slot, string>, priceFactor: number) {
  const meals = SLOTS.map((s) => MEALS_BY_ID[plan[s.key]]).filter(Boolean);
  const mac = meals.map(mealMacros).reduce(
    (a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return { cost: meals.reduce((a, m) => a + mealCost(m, priceFactor), 0), ...mac };
}

/** Plans built before a meal was renamed/removed from the database get repaired. */
export function isValidPlan(plan: Record<Slot, string> | undefined): plan is Record<Slot, string> {
  return !!plan && SLOTS.every((s) => MEALS_BY_ID[plan[s.key]]?.slot === s.key);
}
