import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { C, type IconName } from './ui';

const ICONS: Record<string, [IconName, IconName]> = {
  index: ['flash-outline', 'flash'],
  workout: ['barbell-outline', 'barbell'],
  meals: ['restaurant-outline', 'restaurant'],
  wallet: ['wallet-outline', 'wallet'],
  me: ['person-outline', 'person'],
};

/** Floating pill tab bar with a sliding red highlight behind the active tab. */
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const count = state.routes.length;
  const width = useSharedValue(0);
  const index = useSharedValue(state.index);
  const [keyboard, setKeyboard] = useState(false);

  useEffect(() => {
    index.set(withSpring(state.index, { damping: 18, stiffness: 220, mass: 0.6 }));
  }, [state.index, index]);

  // Get out of the way while typing.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const pill = useAnimatedStyle(() => {
    const w = width.get() / count;
    return { width: w - 8, transform: [{ translateX: index.get() * w + 4 }] };
  });

  if (keyboard && Platform.OS !== 'web') return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 14), paddingHorizontal: 20 }}>
      <View
        onLayout={(e) => width.set(e.nativeEvent.layout.width)}
        style={{
          flexDirection: 'row',
          backgroundColor: 'rgba(20,20,20,0.97)',
          borderRadius: 30,
          borderWidth: 1,
          borderColor: C.line,
          paddingVertical: 6,
          ...Platform.select({
            android: { elevation: 16 },
            default: { shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
          }),
        }}>
        <Animated.View style={[{ position: 'absolute', top: 6, bottom: 6, borderRadius: 24, backgroundColor: 'rgba(226,35,45,0.14)' }, pill]} />
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
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 4 }}>
              <Ionicons name={focused ? on : off} size={22} color={focused ? C.accent : C.dim} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: focused ? C.ink : C.dim }}>{options.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
