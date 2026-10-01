import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MEALS_BY_ID, mealCost, type Slot } from '@/data/foods';
import type { Activity, Macros } from './fitness';

export type Profile = {
  name: string;
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm: number | null;
  activity: Activity;
};

export type BodyLog = { day: string; weightKg: number; waistCm: number | null };

export type CustomFood = Macros & { id: string; name: string; cost: number };

export type DayMeals = {
  plan: Record<Slot, string>;
  eaten: Slot[];
  extras: CustomFood[];
};

export type DayWorkout = { done: string[]; pushups: number };

export const CATEGORIES = {
  food: { label: 'Food', icon: 'fast-food-outline' },
  groceries: { label: 'Groceries', icon: 'basket-outline' },
  transport: { label: 'Transport', icon: 'bus-outline' },
  bills: { label: 'Bills', icon: 'flash-outline' },
  load: { label: 'Load/Data', icon: 'phone-portrait-outline' },
  health: { label: 'Health', icon: 'medkit-outline' },
  shopping: { label: 'Shopping', icon: 'bag-handle-outline' },
  fun: { label: 'Leisure', icon: 'game-controller-outline' },
  family: { label: 'Family', icon: 'heart-outline' },
  other: { label: 'Other', icon: 'ellipsis-horizontal' },
} as const;
export type Category = keyof typeof CATEGORIES;

export type Expense = {
  id: string;
  day: string;
  ts: number;
  amount: number;
  category: Category;
  note: string;
  /** Set when the expense was auto-created by eating a planned meal. */
  mealSlot?: Slot;
};

export type PaySchedule = 'monthly' | 'kinsenas';

type State = {
  profile: Profile | null;
  body: BodyLog[];
  workouts: Record<string, DayWorkout>;
  meals: Record<string, DayMeals>;
  foodBudget: number;
  priceFactor: number;
  autoLogMeals: boolean;
  salary: number;
  paySchedule: PaySchedule;
  defaultDailyBudget: number;
  dailyBudgets: Record<string, number>;
  expenses: Expense[];
};

type Actions = {
  saveProfile: (p: Profile, today: string) => void;
  logBody: (entry: BodyLog) => void;
  removeBody: (day: string) => void;

  toggleExercise: (day: string, id: string) => void;
  addPushups: (day: string, n: number) => void;

  setPlan: (day: string, plan: Record<Slot, string>) => void;
  setMeal: (day: string, slot: Slot, mealId: string) => void;
  toggleEaten: (day: string, slot: Slot) => void;
  addCustomFood: (day: string, food: Omit<CustomFood, 'id'>) => void;
  removeCustomFood: (day: string, id: string) => void;

  setSettings: (s: Partial<Pick<State, 'foodBudget' | 'priceFactor' | 'autoLogMeals' | 'salary' | 'paySchedule' | 'defaultDailyBudget'>>) => void;
  setDailyBudget: (day: string, amount: number) => void;
  addExpense: (e: Omit<Expense, 'id' | 'ts'> & { ts?: number }) => void;
  removeExpense: (id: string) => void;

  resetAll: () => void;
};

const initial: State = {
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
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const EMPTY_WORKOUT: DayWorkout = { done: [], pushups: 0 };

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      saveProfile: (p, today) =>
        set((s) => ({
          profile: p,
          body: upsertBody(s.body, { day: today, weightKg: p.weightKg, waistCm: p.waistCm }),
        })),

      logBody: (entry) =>
        set((s) => {
          const body = upsertBody(s.body, entry);
          // The newest log is the current body; keep the profile in sync.
          const latest = body[body.length - 1];
          const profile = s.profile && latest.day === entry.day
            ? { ...s.profile, weightKg: entry.weightKg, waistCm: entry.waistCm ?? s.profile.waistCm }
            : s.profile;
          return { body, profile };
        }),

      removeBody: (day) => set((s) => ({ body: s.body.filter((b) => b.day !== day) })),

      toggleExercise: (day, id) =>
        set((s) => {
          const w = s.workouts[day] ?? EMPTY_WORKOUT;
          const done = w.done.includes(id) ? w.done.filter((x) => x !== id) : [...w.done, id];
          return { workouts: { ...s.workouts, [day]: { ...w, done } } };
        }),

      addPushups: (day, n) =>
        set((s) => {
          const w = s.workouts[day] ?? EMPTY_WORKOUT;
          return { workouts: { ...s.workouts, [day]: { ...w, pushups: Math.max(0, w.pushups + n) } } };
        }),

      // Creates the day's plan, or regenerates it (which un-eats every slot,
      // while keeping foods you added yourself).
      setPlan: (day, plan) =>
        set((s) => ({
          meals: { ...s.meals, [day]: { plan, eaten: [], extras: s.meals[day]?.extras ?? [] } },
          expenses: s.expenses.filter((e) => !(e.day === day && e.mealSlot)),
        })),

      setMeal: (day, slot, mealId) =>
        set((s) => {
          const m = s.meals[day];
          if (!m) return {};
          const wasEaten = m.eaten.includes(slot);
          const next: DayMeals = { ...m, plan: { ...m.plan, [slot]: mealId }, eaten: m.eaten.filter((x) => x !== slot) };
          // Swapping an eaten meal un-eats it, so drop its auto-logged expense too.
          const expenses = wasEaten ? s.expenses.filter((e) => !(e.day === day && e.mealSlot === slot)) : s.expenses;
          return { meals: { ...s.meals, [day]: next }, expenses };
        }),

      toggleEaten: (day, slot) =>
        set((s) => {
          const m = s.meals[day];
          if (!m) return {};
          const eating = !m.eaten.includes(slot);
          const eaten = eating ? [...m.eaten, slot] : m.eaten.filter((x) => x !== slot);
          let expenses = s.expenses.filter((e) => !(e.day === day && e.mealSlot === slot));
          const meal = MEALS_BY_ID[m.plan[slot]];
          if (eating && s.autoLogMeals && meal) {
            expenses = [
              ...expenses,
              { id: uid(), day, ts: Date.now(), amount: mealCost(meal, s.priceFactor), category: 'food', note: meal.name, mealSlot: slot },
            ];
          }
          return { meals: { ...s.meals, [day]: { ...m, eaten } }, expenses };
        }),

      addCustomFood: (day, food) =>
        set((s) => {
          const m = s.meals[day];
          if (!m) return {};
          return { meals: { ...s.meals, [day]: { ...m, extras: [...m.extras, { ...food, id: uid() }] } } };
        }),

      removeCustomFood: (day, id) =>
        set((s) => {
          const m = s.meals[day];
          if (!m) return {};
          return { meals: { ...s.meals, [day]: { ...m, extras: m.extras.filter((f) => f.id !== id) } } };
        }),

      setSettings: (patch) => set(patch),

      setDailyBudget: (day, amount) => set((s) => ({ dailyBudgets: { ...s.dailyBudgets, [day]: amount } })),

      addExpense: (e) =>
        set((s) => ({ expenses: [...s.expenses, { ...e, id: uid(), ts: e.ts ?? Date.now() }] })),

      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'fitpeso-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Only data is saved; actions are recreated on every launch.
      partialize: (s) =>
        Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function')) as State,
    },
  ),
);

function upsertBody(list: BodyLog[], entry: BodyLog): BodyLog[] {
  return [...list.filter((b) => b.day !== entry.day), entry].sort((a, b) => a.day.localeCompare(b.day));
}

/** The budget for a day: an override if you set one, otherwise your default. */
export function budgetFor(s: Pick<State, 'dailyBudgets' | 'defaultDailyBudget'>, day: string): number {
  return s.dailyBudgets[day] ?? s.defaultDailyBudget;
}

/** True once saved data has been loaded from the phone's storage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(useStore.persist.onFinishHydration, useStore.persist.hasHydrated, () => false);
}
