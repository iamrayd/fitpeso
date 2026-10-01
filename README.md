# FitPeso 💪₱

A personal fitness and wallet tracker built for one goal: **lose the belly fat on a Cebu budget.**

- **Today**: calories and macros eaten vs target, 100 push-up counter, money left today, next meal, BMI and waist-to-height.
- **Train**: a 7-day plan for 2 dumbbells plus bodyweight, a daily 10-minute posture routine for anterior pelvic tilt, and the 100 push-ups tracker.
- **Meals**: a breakfast, lunch, snack and dinner plan each day that fits your food budget (default ₱200) and hits your protein target, with Cebu market prices for every ingredient. Swap any meal, re-plan the day, or log food you ate outside the plan.
- **Wallet**: daily budget, quick expense logging by category, a pay-period view (kinsenas or monthly) that tells you how much you can safely spend per day until payday, a 7-day chart, and a category breakdown.
- **Me**: BMI (Asia-Pacific cut-offs), a belly-fat tracker (waist-to-height), daily targets, a weight/waist log with trend, and settings.

All data stays on your phone. No account, no server, works offline.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| App | **React Native + Expo SDK 57** (Expo Router) | One codebase, a real native Android app, and over-the-air updates |
| Styling | **NativeWind 4** (Tailwind CSS for React Native) | Tailwind classes, compiled ahead of time to native styles |
| Animation | **Reanimated 4** | Animations run on the UI thread, so they stay smooth |
| State + storage | **Zustand + AsyncStorage** (local-first) | Instant loads, offline, free, private |
| Charts/rings | react-native-svg | Lightweight; no chart library needed |

**Backend:** none on purpose. For a single-user tracker, local storage is the fastest, cheapest and most reliable option. If you later want cloud backup or multi-device sync, add **Supabase** (free tier, Postgres + auth) and sync the Zustand store.

## Run it on your phone

1. Install **Expo Go** from the Play Store.
2. On your computer:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code with Expo Go (same Wi-Fi network). Use `npx expo start --tunnel` if it won't connect.

## Build a real APK (install without Expo Go)

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```
EAS builds it in the cloud and gives you a download link for the `.apk`.

## Project layout

```
src/
  app/            screens (Expo Router)
    (tabs)/       Today · Train · Meals · Wallet · Me
    onboarding.tsx, add-expense.tsx, add-food.tsx
  components/     UI kit (animated buttons, rings, bars), tab bar, profile form
  data/
    foods.ts      Cebu ingredient prices + macros, meal recipes
    workouts.ts   weekly plan, posture routine, push-up tips
  lib/
    store.ts      Zustand store (persisted)
    planner.ts    budget-aware meal planner
    fitness.ts    BMI, BMR/TDEE, macro targets
    wallet.ts     pay periods, totals
```

## Updating prices

Prices in `src/data/foods.ts` are estimates for Cebu City markets in late 2026. To scale them all quickly, use **Me → Settings → Market prices** (−10% to +25%), or edit the `cost` of any ingredient in that file.

## Checks

```bash
npx tsc --noEmit   # types
npx expo lint      # lint (includes React Compiler rules)
npx expo-doctor    # dependency health
```
