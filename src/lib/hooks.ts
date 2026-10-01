import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { MEALS_BY_ID, mealMacros, type Slot } from '@/data/foods';
import { addDays, dateKey } from './date';
import { sumMacros, targets, type Macros } from './fitness';
import { generatePlan, isValidPlan } from './planner';
import { useStore } from './store';

/** Today's date key, refreshed when the app returns to the foreground and each minute (midnight rollover). */
export function useToday(): string {
  const [today, setToday] = useState(dateKey);
  useEffect(() => {
    const tick = () => setToday((prev) => (prev === dateKey() ? prev : dateKey()));
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    const id = setInterval(tick, 60_000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);
  return today;
}

export function useTargets(): Macros | null {
  const profile = useStore((s) => s.profile);
  return useMemo(() => (profile ? targets(profile) : null), [profile]);
}

/** Makes sure a meal plan exists for `day`, generating one on first view. */
export function useDayMeals(day: string) {
  const dayMeals = useStore((s) => s.meals[day]);
  const yesterdayPlan = useStore((s) => s.meals[addDays(day, -1)]?.plan);
  const foodBudget = useStore((s) => s.foodBudget);
  const priceFactor = useStore((s) => s.priceFactor);
  const setPlan = useStore((s) => s.setPlan);
  const t = useTargets();

  useEffect(() => {
    if (!t || isValidPlan(dayMeals?.plan)) return;
    const avoid = yesterdayPlan ? Object.values(yesterdayPlan) : [];
    setPlan(day, generatePlan(day, { targets: t, budget: foodBudget, priceFactor }, avoid));
  }, [day, t, dayMeals?.plan, yesterdayPlan, foodBudget, priceFactor, setPlan]);

  return isValidPlan(dayMeals?.plan) ? dayMeals : null;
}

/** Calories and macros actually eaten on a day: checked-off meals plus foods you added. */
export function useEatenMacros(day: string): Macros {
  const dm = useStore((s) => s.meals[day]);
  return useMemo(() => {
    if (!dm) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    const planned = dm.eaten
      .map((slot: Slot) => MEALS_BY_ID[dm.plan[slot]])
      .filter(Boolean)
      .map(mealMacros);
    return sumMacros([...planned, ...dm.extras]);
  }, [dm]);
}
