import type { Profile } from './store';

export type Macros = { kcal: number; protein: number; carbs: number; fat: number };

export const ACTIVITY = {
  sedentary: { label: 'Mostly sitting', hint: 'Desk job, little walking', factor: 1.2 },
  light: { label: 'Lightly active', hint: 'Workouts 3–4×/week', factor: 1.375 },
  moderate: { label: 'Active', hint: 'Workouts 5–6×/week or on your feet', factor: 1.55 },
} as const;
export type Activity = keyof typeof ACTIVITY;

export function bmi(p: Pick<Profile, 'heightCm' | 'weightKg'>): number {
  const m = p.heightCm / 100;
  return m > 0 ? p.weightKg / (m * m) : 0;
}

// Asia-Pacific cut-offs (WHO 2000 / used by the Philippine DOH). Filipinos carry
// more body fat at the same BMI, so these are stricter than the global ones.
export function bmiCategory(v: number): { label: string; color: string } {
  if (v < 18.5) return { label: 'Underweight', color: '#A3A3A3' };
  if (v < 23) return { label: 'Normal', color: '#F5F5F5' };
  if (v < 25) return { label: 'Overweight', color: '#F5A524' };
  return { label: 'Obese', color: '#E2232D' };
}

/** BMI scale stops used to draw the gauge: [start, end, color]. */
export const BMI_BANDS: [number, number, string][] = [
  [15, 18.5, '#6B6B6B'],
  [18.5, 23, '#F5F5F5'],
  [23, 25, '#F5A524'],
  [25, 32, '#E2232D'],
];

/** Waist-to-height ratio: the best quick indicator of belly (visceral) fat. */
export function whtr(p: Pick<Profile, 'heightCm' | 'waistCm'>): number | null {
  if (!p.waistCm || !p.heightCm) return null;
  return p.waistCm / p.heightCm;
}

export function whtrCategory(v: number): { label: string; color: string } {
  if (v < 0.43) return { label: 'Slim', color: '#A3A3A3' };
  if (v < 0.5) return { label: 'Healthy', color: '#F5F5F5' };
  if (v < 0.55) return { label: 'Watch it', color: '#F5A524' };
  return { label: 'High', color: '#E2232D' };
}

/** Mifflin–St Jeor BMR. */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'male' ? base + 5 : base - 161;
}

export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY[p.activity].factor;
}

/**
 * Daily targets for a "skinny-fat" body recomposition: a gentle ~12% deficit
 * (a hard cut on a lean frame mostly burns muscle), high protein to build
 * muscle while losing belly fat, ~25% fat, and carbs for the rest.
 * If BMI is already low the deficit is skipped and we eat at maintenance.
 */
export function targets(p: Profile): Macros {
  const maintenance = tdee(p);
  const b = bmi(p);
  const deficit = b < 18.5 ? 0 : b < 23 ? 0.12 : 0.18;
  const kcal = Math.round((maintenance * (1 - deficit)) / 10) * 10;
  const protein = Math.round(p.weightKg * 1.8);
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat };
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
