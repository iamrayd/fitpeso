import '@/global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { C } from '@/components/ui';
import { startReminderSync } from '@/lib/reminders';
import { useHydrated } from '@/lib/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, primary: C.accent, text: C.ink, border: C.line },
};

export default function RootLayout() {
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  // Reminders are rescheduled from saved data, so start only once it has loaded.
  useEffect(() => (hydrated ? startReminderSync() : undefined), [hydrated]);

  // Keep the splash up until saved data is loaded, so nothing flickers.
  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'fade' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="add-expense" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="add-food" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="add-money" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="account" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="transfer" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
