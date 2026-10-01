// Plain data with no React Native imports, so backup validation can be tested in Node.

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

export const ACCOUNT_ICONS = ['cash-outline', 'phone-portrait-outline', 'business-outline', 'card-outline', 'wallet-outline', 'save-outline'] as const;
export type AccountIcon = (typeof ACCOUNT_ICONS)[number];

export type AccountSeed = { id: string; name: string; icon: AccountIcon; base: number };

export function defaultAccounts(): AccountSeed[] {
  return [
    { id: 'cash', name: 'Cash', icon: 'cash-outline', base: 0 },
    { id: 'gcash', name: 'GCash', icon: 'phone-portrait-outline', base: 0 },
    { id: 'bank', name: 'Bank', icon: 'business-outline', base: 0 },
  ];
}
