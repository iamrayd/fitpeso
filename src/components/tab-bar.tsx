import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { C, haptic, type IconName } from './ui';

const ICONS: Record<string, [IconName, IconName]> = {
  index: ['flash-outline', 'flash'],
  workout: ['barbell-outline', 'barbell'],
  meals: ['restaurant-outline', 'restaurant'],
  wallet: ['wallet-outline', 'wallet'],
  me: ['person-outline', 'person'],
};

/** Floating pill tab bar with a sliding highlight behind the active tab. */
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const count = state.routes.length;
  const width = useSharedValue(0);
  const index = useSharedValue(state.index);

  useEffect(() => {
    index.set(withSpring(state.index, { damping: 18, stiffness: 220, mass: 0.6 }));
  }, [state.index, index]);

  const pill = useAnimatedStyle(() => {
    const w = width.get() / count;
    return { width: w - 8, transform: [{ translateX: index.get() * w + 4 }] };
  });

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: 16 }}>
      <View
        onLayout={(e) => width.set(e.nativeEvent.layout.width)}
        style={{
          flexDirection: 'row',
          backgroundColor: 'rgba(20,22,27,0.97)',
          borderRadius: 28,
          borderWidth: 1,
          borderColor: C.line,
          paddingVertical: 6,
          ...Platform.select({
            android: { elevation: 16 },
            default: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
          }),
        }}>
        <Animated.View style={[{ position: 'absolute', top: 6, bottom: 6, borderRadius: 22, backgroundColor: C.raised }, pill]} />
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const { options } = descriptors[route.key];
          const [off, on] = ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.title}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  haptic.pick();
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 3 }}>
              <Ionicons name={focused ? on : off} size={22} color={focused ? C.lime : C.dim} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: focused ? C.ink : C.dim }}>{options.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
