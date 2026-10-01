import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';
import { C } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function TabsLayout() {
  const hasProfile = useStore((s) => !!s.profile);
  if (!hasProfile) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: C.bg } }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="workout" options={{ title: 'Train' }} />
      <Tabs.Screen name="meals" options={{ title: 'Meals' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
