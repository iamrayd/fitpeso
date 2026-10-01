import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { cssInterop } from 'nativewind';
import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, type PressableProps, type TextInputProps } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const C = {
  bg: '#0A0B0E',
  card: '#14161B',
  raised: '#1C1F26',
  line: '#262A33',
  ink: '#F4F5F7',
  sub: '#9BA1AD',
  dim: '#5F6673',
  lime: '#C6F432',
  mint: '#3DDC97',
  sky: '#5AB4FF',
  amber: '#FFB547',
  rose: '#FF6B7A',
  violet: '#A78BFA',
};

const native = Platform.OS !== 'web';
export const haptic = {
  tap: () => native && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  pick: () => native && Haptics.selectionAsync().catch(() => {}),
  success: () => native && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warn: () => native && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};

/** Scrollable page with safe-area padding and room for the floating tab bar. */
export function Screen({ children, header }: { children: ReactNode; header?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 16, gap: 14 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        {header}
        {children}
      </ScrollView>
    </View>
  );
}

export function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <View className="mb-1 flex-row items-end justify-between">
      <View className="flex-1">
        {eyebrow ? <Text className="text-[13px] font-semibold uppercase tracking-widest text-dim">{eyebrow}</Text> : null}
        <Text className="text-[30px] font-extrabold tracking-tight text-ink">{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: object }) {
  return (
    <View className={`rounded-3xl border border-line bg-card p-4 ${className}`} style={style}>
      {children}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View className="mt-2 flex-row items-center justify-between px-1">
      <Text className="text-[13px] font-bold uppercase tracking-widest text-sub">{children}</Text>
      {right}
    </View>
  );
}

const APressable = Animated.createAnimatedComponent(Pressable);
// Let NativeWind turn className into styles on the animated Pressable too.
cssInterop(APressable, { className: 'style' });

/** Pressable that springs down a little on touch, with optional haptics. */
export function Tap({ children, onPress, haptics = 'tap', style, className, disabled, ...rest }: PressableProps & { haptics?: keyof typeof haptic | false; className?: string; style?: object; children: ReactNode }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <APressable
      {...rest}
      disabled={disabled}
      className={className}
      style={[anim, style, disabled ? { opacity: 0.4 } : null]}
      onPressIn={() => scale.set(withSpring(0.96, { damping: 20, stiffness: 400 }))}
      onPressOut={() => scale.set(withSpring(1, { damping: 14, stiffness: 300 }))}
      onPress={(e) => {
        if (haptics) haptic[haptics]();
        onPress?.(e);
      }}>
      {children}
    </APressable>
  );
}

export function Button({ label, icon, onPress, variant = 'primary', small, disabled }: { label: string; icon?: IconName; onPress: () => void; variant?: 'primary' | 'ghost' | 'danger'; small?: boolean; disabled?: boolean }) {
  const bg = variant === 'primary' ? 'bg-lime' : variant === 'danger' ? 'bg-rose/15' : 'bg-raised';
  const fg = variant === 'primary' ? '#0A0B0E' : variant === 'danger' ? C.rose : C.ink;
  return (
    <Tap onPress={onPress} disabled={disabled} className={`flex-row items-center justify-center rounded-2xl ${bg} ${small ? 'px-3 py-2' : 'px-5 py-4'}`} style={{ gap: 8 }}>
      {icon ? <Ionicons name={icon} size={small ? 16 : 19} color={fg} /> : null}
      <Text style={{ color: fg }} className={`font-bold ${small ? 'text-[13px]' : 'text-[16px]'}`}>
        {label}
      </Text>
    </Tap>
  );
}

export function IconButton({ icon, onPress, color = C.ink, bg = C.raised, size = 40 }: { icon: IconName; onPress: () => void; color?: string; bg?: string; size?: number }) {
  return (
    <Tap onPress={onPress} haptics="pick" style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={size * 0.48} color={color} />
    </Tap>
  );
}

const ACircle = Animated.createAnimatedComponent(Circle);

/** Circular progress ring with a smooth fill animation. */
export function Ring({ size = 120, stroke = 12, progress, color = C.lime, track = C.raised, children }: { size?: number; stroke?: number; progress: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(Math.min(1, Math.max(0, progress)), { duration: 900 }));
  }, [progress, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.get()) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <ACircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} animatedProps={props} />
      </Svg>
      {children}
    </View>
  );
}

/** Horizontal progress bar; turns red when over 100%. */
export function Bar({ progress, color = C.lime, height = 8, overColor = C.rose }: { progress: number; color?: string; height?: number; overColor?: string }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.set(withTiming(Math.min(1, Math.max(0, progress)), { duration: 700 }));
  }, [progress, w]);
  const anim = useAnimatedStyle(() => ({ width: `${w.get() * 100}%` }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: C.raised, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: progress > 1 ? overColor : color }, anim]} />
    </View>
  );
}

export function MacroBar({ label, value, target, color, unit = 'g' }: { label: string; value: number; target: number; color: string; unit?: string }) {
  return (
    <View className="flex-1" style={{ gap: 6 }}>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[12px] font-semibold text-sub">{label}</Text>
        <Text className="text-[12px] text-dim">
          <Text className="font-bold text-ink">{Math.round(value)}</Text>/{target}
          {unit}
        </Text>
      </View>
      <Bar progress={target ? value / target : 0} color={color} height={6} />
    </View>
  );
}

export function Pill({ label, color = C.sub, bg }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={{ backgroundColor: bg ?? `${color}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' }}>
      <Text style={{ color }} className="text-[11px] font-bold uppercase tracking-wider">
        {label}
      </Text>
    </View>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View className="flex-row rounded-2xl bg-raised p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Tap key={o.value} haptics="pick" onPress={() => onChange(o.value)} className={`flex-1 items-center rounded-xl py-2.5 ${on ? 'bg-ink' : ''}`}>
            <Text className={`text-[14px] font-bold ${on ? 'text-bg' : 'text-sub'}`}>{o.label}</Text>
          </Tap>
        );
      })}
    </View>
  );
}

export function Field({ label, suffix, prefix, ...props }: TextInputProps & { label: string; suffix?: string; prefix?: string }) {
  return (
    <View style={{ gap: 6 }} className="flex-1">
      <Text className="px-1 text-[12px] font-semibold uppercase tracking-wider text-dim">{label}</Text>
      <View className="flex-row items-center rounded-2xl border border-line bg-raised px-4">
        {prefix ? <Text className="mr-1 text-[17px] font-semibold text-sub">{prefix}</Text> : null}
        <TextInput placeholderTextColor={C.dim} selectionColor={C.lime} className="flex-1 py-3.5 text-[17px] font-semibold text-ink" {...props} />
        {suffix ? <Text className="ml-1 text-[14px] font-semibold text-dim">{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Stat({ label, value, sub, color = C.ink }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View className="flex-1" style={{ gap: 2 }}>
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-dim">{label}</Text>
      <Text style={{ color }} className="text-[20px] font-extrabold tracking-tight">
        {value}
      </Text>
      {sub ? <Text className="text-[12px] text-sub">{sub}</Text> : null}
    </View>
  );
}

export function Check({ on, color = C.lime, size = 26 }: { on: boolean; color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: on ? color : C.line, backgroundColor: on ? color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {on ? <Ionicons name="checkmark" size={size * 0.62} color={C.bg} /> : null}
    </View>
  );
}
