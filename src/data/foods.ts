import type { Macros } from '@/lib/fitness';

/**
 * Ingredient prices: estimated Cebu City public-market / sari-sari prices
 * (Carbon, Taboan, local palengke), late 2026. They drift, so every price can
 * be scaled with the "price adjustment" setting in Me → Settings.
 * Macros come from USDA / FNRI Philippine Food Composition Tables.
 */
export type Ingredient = Macros & { name: string; unit: string; cost: number };

export const ING = {
  egg: { name: 'Egg', unit: '1 large', cost: 9, kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  rice: { name: 'Rice', unit: '1 cup cooked', cost: 5, kcal: 205, protein: 4.3, carbs: 45, fat: 0.4 },
  cornRice: { name: 'Corn rice (bugas mais)', unit: '1 cup cooked', cost: 5, kcal: 180, protein: 4.5, carbs: 38, fat: 1.2 },
  puso: { name: 'Puso (hanging rice)', unit: '1 pc', cost: 8, kcal: 185, protein: 3.8, carbs: 41, fat: 0.3 },
  chickenBreast: { name: 'Chicken breast', unit: '100 g', cost: 26, kcal: 120, protein: 23, carbs: 0, fat: 2.6 },
  chickenThigh: { name: 'Chicken thigh', unit: '120 g (bone-in)', cost: 24, kcal: 175, protein: 18, carbs: 0, fat: 11 },
  chickenLiver: { name: 'Chicken liver', unit: '100 g', cost: 18, kcal: 119, protein: 17, carbs: 0.7, fat: 4.8 },
  tunaCan: { name: 'Tuna flakes in water', unit: '1 can (155 g)', cost: 42, kcal: 130, protein: 26, carbs: 0, fat: 1.5 },
  sardines: { name: 'Sardines in tomato sauce', unit: '1 can (155 g)', cost: 28, kcal: 220, protein: 20, carbs: 5, fat: 13 },
  galunggong: { name: 'Galunggong', unit: '150 g', cost: 36, kcal: 185, protein: 31, carbs: 0, fat: 6 },
  tilapia: { name: 'Tilapia', unit: '150 g', cost: 24, kcal: 145, protein: 30, carbs: 0, fat: 2.5 },
  tokwa: { name: 'Tokwa (firm tofu)', unit: '1 block (150 g)', cost: 20, kcal: 180, protein: 19, carbs: 4, fat: 10 },
  giniling: { name: 'Lean pork giniling', unit: '100 g', cost: 32, kcal: 210, protein: 20, carbs: 0, fat: 14 },
  monggo: { name: 'Monggo (dry)', unit: '60 g', cost: 7, kcal: 210, protein: 14, carbs: 38, fat: 0.7 },
  kangkong: { name: 'Kangkong', unit: '1 bundle', cost: 15, kcal: 25, protein: 3, carbs: 4, fat: 0.3 },
  malunggay: { name: 'Malunggay', unit: '1 handful', cost: 5, kcal: 15, protein: 2, carbs: 2, fat: 0.3 },
  pechay: { name: 'Pechay', unit: '1 bundle', cost: 20, kcal: 20, protein: 2, carbs: 3, fat: 0.3 },
  sitaw: { name: 'Sitaw', unit: '1 bundle', cost: 15, kcal: 35, protein: 2, carbs: 7, fat: 0.2 },
  kalabasa: { name: 'Kalabasa', unit: '150 g', cost: 9, kcal: 50, protein: 1.5, carbs: 12, fat: 0.2 },
  sayote: { name: 'Sayote', unit: '1 pc', cost: 10, kcal: 30, protein: 1, carbs: 7, fat: 0.2 },
  tomato: { name: 'Tomato', unit: '1 pc', cost: 5, kcal: 20, protein: 1, carbs: 4, fat: 0.2 },
  aromatics: { name: 'Onion, garlic, ginger', unit: 'for 1 dish', cost: 6, kcal: 20, protein: 0.5, carbs: 4, fat: 0 },
  oil: { name: 'Cooking oil', unit: '1 tsp', cost: 1, kcal: 40, protein: 0, carbs: 0, fat: 4.5 },
  seasoning: { name: 'Soy sauce, vinegar, salt', unit: 'for 1 dish', cost: 2, kcal: 10, protein: 1, carbs: 1, fat: 0 },
  saba: { name: 'Saba banana', unit: '1 pc', cost: 8, kcal: 110, protein: 1.2, carbs: 28, fat: 0.3 },
  banana: { name: 'Lakatan banana', unit: '1 pc', cost: 10, kcal: 100, protein: 1.2, carbs: 25, fat: 0.3 },
  camote: { name: 'Camote', unit: '150 g', cost: 10, kcal: 130, protein: 2.4, carbs: 30, fat: 0.1 },
  oats: { name: 'Rolled oats', unit: '40 g', cost: 9, kcal: 150, protein: 5, carbs: 27, fat: 3 },
  peanutButter: { name: 'Peanut butter', unit: '1 tbsp', cost: 5, kcal: 95, protein: 4, carbs: 3, fat: 8 },
  milkPowder: { name: 'Powdered milk sachet', unit: '33 g', cost: 14, kcal: 160, protein: 8, carbs: 11, fat: 9 },
  pandesal: { name: 'Pandesal', unit: '1 pc', cost: 5, kcal: 110, protein: 3, carbs: 20, fat: 2 },
  peanuts: { name: 'Boiled peanuts', unit: '1 small pack (50 g)', cost: 10, kcal: 160, protein: 7, carbs: 5, fat: 11 },
} satisfies Record<string, Ingredient>;

export type IngKey = keyof typeof ING;
export type Slot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type Meal = {
  id: string;
  name: string;
  slot: Slot;
  tip: string;
  items: [IngKey, number][];
};

export const SLOTS: { key: Slot; label: string; icon: 'sunny-outline' | 'restaurant-outline' | 'cafe-outline' | 'moon-outline'; time: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline', time: '6–8 AM' },
  { key: 'lunch', label: 'Lunch', icon: 'restaurant-outline', time: '12–1 PM' },
  { key: 'snack', label: 'Snack', icon: 'cafe-outline', time: '3–4 PM' },
  { key: 'dinner', label: 'Dinner', icon: 'moon-outline', time: '6–7 PM' },
];

export const MEALS: Meal[] = [
  // Breakfast
  { id: 'b-boiled-eggs-rice', slot: 'breakfast', name: '3 boiled eggs + rice + tomato', tip: 'Boil a batch of eggs every 2 days so breakfast takes 1 minute.', items: [['egg', 3], ['rice', 1], ['tomato', 1], ['seasoning', 0.5]] },
  { id: 'b-oats-pb', slot: 'breakfast', name: 'Oats with banana, peanut butter + 1 egg', tip: 'Cook oats with water, slice the banana in, stir in the peanut butter.', items: [['oats', 1], ['banana', 1], ['peanutButter', 1], ['egg', 1]] },
  { id: 'b-malunggay-scramble', slot: 'breakfast', name: 'Malunggay scrambled eggs + corn rice', tip: 'Corn rice keeps you full longer than white rice and costs the same.', items: [['egg', 3], ['malunggay', 1], ['cornRice', 1], ['oil', 1], ['aromatics', 0.5]] },
  { id: 'b-pandesal-eggs', slot: 'breakfast', name: '2 pandesal + 2 eggs + milk', tip: 'Fry the eggs in a non-stick pan with a few drops of oil.', items: [['pandesal', 2], ['egg', 2], ['milkPowder', 1], ['oil', 1]] },
  { id: 'b-tuna-omelette', slot: 'breakfast', name: 'Tuna omelette + rice', tip: 'Use half a can; keep the rest in the fridge for later.', items: [['egg', 2], ['tunaCan', 0.5], ['rice', 1], ['aromatics', 0.5], ['oil', 1]] },
  { id: 'b-camote-eggs', slot: 'breakfast', name: 'Boiled camote + 2 eggs + milk', tip: 'Camote is a slow carb with lots of fiber, good for steady energy.', items: [['camote', 1], ['egg', 2], ['milkPowder', 1]] },
  { id: 'b-tokwa-egg', slot: 'breakfast', name: 'Tokwa & egg scramble + puso', tip: 'Crumble the tokwa into the eggs. It doubles the protein for ₱10.', items: [['tokwa', 0.5], ['egg', 2], ['puso', 1], ['oil', 1], ['seasoning', 0.5]] },

  // Lunch
  { id: 'l-chicken-adobo', slot: 'lunch', name: 'Chicken breast adobo + kangkong', tip: 'Adobo keeps for 2–3 days, so cook a bigger batch.', items: [['chickenBreast', 1.5], ['rice', 1.5], ['kangkong', 0.5], ['aromatics', 1], ['seasoning', 1], ['oil', 1]] },
  { id: 'l-paksiw-galunggong', slot: 'lunch', name: 'Paksiw na galunggong + pechay', tip: 'Paksiw needs no oil at all: just vinegar, garlic and ginger.', items: [['galunggong', 1], ['rice', 1.5], ['pechay', 0.5], ['aromatics', 1], ['seasoning', 1]] },
  { id: 'l-monggo', slot: 'lunch', name: 'Ginisang monggo with malunggay + egg', tip: 'Monggo is the cheapest protein in the market. Add an egg to complete it.', items: [['monggo', 1], ['malunggay', 1], ['egg', 1], ['rice', 1], ['aromatics', 1], ['oil', 1]] },
  { id: 'l-tinola', slot: 'lunch', name: 'Tinolang manok with sayote + malunggay', tip: 'Soup at lunch fills you up on fewer calories.', items: [['chickenThigh', 1.5], ['sayote', 1], ['malunggay', 1], ['rice', 1.5], ['aromatics', 1], ['seasoning', 0.5]] },
  { id: 'l-tuna-fried-rice', slot: 'lunch', name: 'Tuna & egg fried rice + tomato', tip: 'Use day-old rice so it fries without much oil.', items: [['tunaCan', 1], ['egg', 2], ['rice', 1.5], ['tomato', 1], ['aromatics', 0.5], ['oil', 2]] },
  { id: 'l-tokwa-giniling', slot: 'lunch', name: "Tokwa't giniling + sitaw", tip: 'Tokwa stretches 50 g of pork into a full high-protein meal.', items: [['tokwa', 1], ['giniling', 0.5], ['sitaw', 0.5], ['rice', 1.5], ['aromatics', 1], ['seasoning', 1], ['oil', 1]] },
  { id: 'l-liver-adobo', slot: 'lunch', name: 'Chicken liver adobo + kangkong', tip: 'Liver is packed with iron and B12 for less than ₱30.', items: [['chickenLiver', 1.5], ['kangkong', 0.5], ['rice', 1.5], ['aromatics', 1], ['seasoning', 1], ['oil', 1]] },

  // Snacks
  { id: 's-eggs', slot: 'snack', name: '2 boiled eggs', tip: 'The easiest 12 g of protein you can buy.', items: [['egg', 2]] },
  { id: 's-saba-pb', slot: 'snack', name: 'Boiled saba + peanut butter', tip: 'Good before a workout for quick energy.', items: [['saba', 1], ['peanutButter', 1]] },
  { id: 's-camote', slot: 'snack', name: 'Boiled camote + 1 egg', tip: 'Better than chips and about the same price.', items: [['camote', 1], ['egg', 1]] },
  { id: 's-milk-pandesal', slot: 'snack', name: 'Milk + pandesal', tip: 'Have it after your workout to help recovery.', items: [['milkPowder', 1], ['pandesal', 1]] },
  { id: 's-banana-egg', slot: 'snack', name: 'Lakatan + 1 boiled egg', tip: 'Light and easy to bring to work.', items: [['banana', 1], ['egg', 1]] },
  { id: 's-peanuts', slot: 'snack', name: 'Boiled peanuts', tip: 'Healthy fats and protein from any street vendor.', items: [['peanuts', 1]] },

  // Dinner
  { id: 'd-tilapia', slot: 'dinner', name: 'Inihaw na tilapia + tomato salad', tip: 'Grilling or steaming keeps it lean. Skip the deep fryer.', items: [['tilapia', 1], ['rice', 1], ['tomato', 2], ['aromatics', 0.5], ['seasoning', 0.5]] },
  { id: 'd-sardines-kangkong', slot: 'dinner', name: 'Ginisang sardinas with kangkong + egg', tip: 'One can, half a bundle, one egg: a full meal for about ₱55.', items: [['sardines', 1], ['kangkong', 0.5], ['egg', 1], ['rice', 1], ['aromatics', 0.5]] },
  { id: 'd-chicken-tinola-light', slot: 'dinner', name: 'Chicken breast tinola (light)', tip: "A lighter dinner helps when you're cutting belly fat.", items: [['chickenBreast', 1.5], ['sayote', 1], ['malunggay', 1], ['rice', 1], ['aromatics', 1]] },
  { id: 'd-kalabasa-giniling', slot: 'dinner', name: 'Kalabasa, sitaw & giniling + egg', tip: 'Lots of veggies with a little meat makes a big plate for few calories.', items: [['kalabasa', 1], ['sitaw', 0.5], ['giniling', 0.5], ['egg', 1], ['rice', 1], ['aromatics', 1], ['oil', 1]] },
  { id: 'd-tokwa-eggs', slot: 'dinner', name: 'Tokwa stir-fry + 2 eggs + pechay', tip: 'Plant protein plus eggs. Cheap and filling.', items: [['tokwa', 1], ['egg', 2], ['pechay', 0.5], ['rice', 1], ['seasoning', 1], ['oil', 1]] },
  { id: 'd-galunggong-sinabaw', slot: 'dinner', name: 'Sinabawang galunggong + kangkong', tip: 'Fish soup with ginger is easy on the stomach at night.', items: [['galunggong', 1], ['kangkong', 0.5], ['tomato', 1], ['rice', 1], ['aromatics', 1]] },
  { id: 'd-tuna-pechay', slot: 'dinner', name: 'Tuna & pechay guisado + puso', tip: 'Sauté the tuna with garlic and onion, then wilt the pechay in.', items: [['tunaCan', 1], ['pechay', 0.5], ['puso', 1], ['aromatics', 0.5], ['oil', 1]] },
];

export const MEALS_BY_ID: Record<string, Meal> = Object.fromEntries(MEALS.map((m) => [m.id, m]));

export function mealCost(m: Meal, priceFactor = 1): number {
  return Math.round(m.items.reduce((s, [k, q]) => s + ING[k].cost * q, 0) * priceFactor);
}

export function mealMacros(m: Meal): Macros {
  const t = m.items.reduce(
    (a, [k, q]) => {
      const i = ING[k];
      return { kcal: a.kcal + i.kcal * q, protein: a.protein + i.protein * q, carbs: a.carbs + i.carbs * q, fat: a.fat + i.fat * q };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return { kcal: Math.round(t.kcal), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat) };
}

export function qtyLabel(q: number): string {
  if (q === 0.5) return '½';
  if (q === 1.5) return '1½';
  return String(q);
}
