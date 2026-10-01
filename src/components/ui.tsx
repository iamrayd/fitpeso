import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, type PressableProps, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Red & black palette from the R/D logo. Keep in sync with tailwind.config.js. */
export const C = {
  bg: '#0A0A0A',
  card: '#141414',
  raised: '#1F1F1F',
  line: '#2A2A2A',
  ink: '#F5F5F5',
  sub: '#A3A3A3',
  dim: '#8A8A8A', // 5.6:1 on bg (WCAG AA for small text)
  accent: '#E2232D', // brand red for rings, icons, borders and large text
  glow: '#FF4D57', // brighter red for small text (6:1 on bg)
  fill: '#D91F28', // red behind white text: buttons, selected tabs (4.6:1)
  warn: '#F5A524',
};

export const GUTTER = 20;

/** Scrollable page with safe-area padding and room for the floating tab bar. */
export function Screen({ children, bottom = 130 }: { children: ReactNode; bottom?: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + bottom, paddingHorizontal: GUTTER, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        {children}
      </ScrollView>
    </View>
  );
}

export function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <View className="flex-row items-end justify-between" style={{ gap: 12 }}>
      <View className="flex-1" style={{ gap: 4 }}>
        {eyebrow ? <Text className="text-[13px] font-semibold text-dim">{eyebrow}</Text> : null}
        <Text accessibilityRole="header" className="text-[32px] font-extrabold tracking-tight text-ink" numberOfLines={1} adjustsFontSizeToFit>
          {title}
          <Text className="text-accent">.</Text>
        </Text>
      </View>
      {right}
    </View>
  );
}

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: object }) {
  return (
    <View className={`rounded-[28px] border border-line bg-card p-5 ${className}`} style={style}>
      {children}
    </View>
  );
}

export function Label({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[12px] font-bold uppercase tracking-[1.5px] text-dim">{children}</Text>
      {right}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View className="mt-3 flex-row items-center justify-between px-1">
      <Text accessibilityRole="header" className="text-[18px] font-extrabold text-ink">
        {children}
      </Text>
      {right}
    </View>
  );
}

/**
 * Pressable that shrinks slightly while held.
 * Must stay a plain RN Pressable: NativeWind does not apply className to
 * Reanimated animated components on native (it only looks right on web).
 */
export function Tap({ children, style, className, disabled, ...rest }: Omit<PressableProps, 'style'> & { className?: string; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      className={className}
      style={[style, { opacity: disabled ? 0.35 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
      onPressIn={(e) => {
        setPressed(true);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        rest.onPressOut?.(e);
      }}>
      {children}
    </Pressable>
  );
}

export function Button({ label, icon, onPress, variant = 'primary', small, disabled, flex }: { label: string; icon?: IconName; onPress: () => void; variant?: 'primary' | 'ghost' | 'danger'; small?: boolean; disabled?: boolean; flex?: boolean }) {
  const bg = variant === 'primary' ? C.fill : variant === 'danger' ? 'rgba(226,35,45,0.12)' : C.raised;
  const fg = variant === 'danger' ? C.glow : C.ink;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      className={`flex-row items-center justify-center ${small ? 'rounded-2xl px-4 py-3' : 'rounded-[22px] px-6 py-[18px]'}`}
      style={{ gap: 8, backgroundColor: bg, flex: flex ? 1 : undefined }}>
      {icon ? <Ionicons name={icon} size={small ? 16 : 20} color={fg} /> : null}
      <Text style={{ color: fg }} className={`font-bold ${small ? 'text-[14px]' : 'text-[17px]'}`}>
        {label}
      </Text>
    </Tap>
  );
}

/** Icon-only button. `label` is required because screen readers can't describe an icon. */
export function IconButton({ icon, label, onPress, color = C.ink, bg = C.raised, size = 44, disabled }: { icon: IconName; label: string; onPress: () => void; color?: string; bg?: string; size?: number; disabled?: boolean }) {
  return (
    <Tap onPress={onPress} disabled={disabled} accessibilityLabel={label} hitSlop={Math.max(6, (48 - size) / 2)} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={size * 0.45} color={color} />
    </Tap>
  );
}

/** Large selectable card with an icon. Used for sex, activity and similar single choices. */
export function OptionCard({ icon, title, hint, selected, onPress }: { icon: IconName; title: string; hint?: string; selected: boolean; onPress: () => void }) {
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={hint ? `${title}, ${hint}` : title}
      className="flex-row items-center rounded-[24px] border-2 px-5 py-5"
      style={{ gap: 16, borderColor: selected ? C.accent : C.line, backgroundColor: selected ? 'rgba(226,35,45,0.10)' : C.card }}>
      <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: selected ? C.accent : C.raised }}>
        <Ionicons name={icon} size={24} color={C.ink} />
      </View>
      <View className="flex-1" style={{ gap: 2 }}>
        <Text className="text-[17px] font-bold text-ink">{title}</Text>
        {hint ? <Text className="text-[13px] text-sub">{hint}</Text> : null}
      </View>
      <Check on={selected} />
    </Tap>
  );
}

const ACircle = Animated.createAnimatedComponent(Circle);

/** Circular progress ring with a smooth fill animation. */
export function Ring({ size = 120, stroke = 12, progress, color = C.accent, track = C.raised, label, children }: { size?: number; stroke?: number; progress: number; color?: string; track?: string; label?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(Math.min(1, Math.max(0, progress)), { duration: 900 }));
  }, [progress, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.get()), strokeOpacity: p.get() > 0.005 ? 1 : 0 }));
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      {...(label ? { accessible: true, accessibilityRole: 'progressbar' as const, accessibilityLabel: label, accessibilityValue: { min: 0, max: 100, now: Math.round(Math.min(1, Math.max(0, progress)) * 100) } } : {})}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <ACircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} animatedProps={props} />
      </Svg>
      {children}
    </View>
  );
}

/** Horizontal progress bar; switches to the warning color past 100%. */
export function Bar({ progress, color = C.accent, height = 8, overColor = C.warn, label }: { progress: number; color?: string; height?: number; overColor?: string; label?: string }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.set(withTiming(Math.min(1, Math.max(0, progress)), { duration: 700 }));
  }, [progress, w]);
  const anim = useAnimatedStyle(() => ({ width: `${w.get() * 100}%` }));
  return (
    <View
      style={{ height, borderRadius: height, backgroundColor: C.raised, overflow: 'hidden' }}
      {...(label ? { accessible: true, accessibilityRole: 'progressbar' as const, accessibilityLabel: label, accessibilityValue: { min: 0, max: 100, now: Math.round(Math.max(0, progress) * 100) } } : {})}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: progress > 1 ? overColor : color }, anim]} />
    </View>
  );
}

export function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <View style={{ gap: 8 }} accessible accessibilityLabel={`${label}: ${Math.round(value)} of ${target} grams`}>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[13px] font-semibold text-sub">{label}</Text>
        <Text className="text-[13px] text-dim">
          <Text className="font-bold text-ink">{Math.round(value)}</Text> / {target}g
        </Text>
      </View>
      <Bar progress={target ? value / target : 0} color={color} height={6} />
    </View>
  );
}

export function Pill({ label, color = C.sub, bg }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={{ backgroundColor: bg ?? C.raised, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start' }}>
      <Text style={{ color }} className="text-[13px] font-bold">
        {label}
      </Text>
    </View>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View className="flex-row rounded-[20px] bg-raised p-1.5" style={{ gap: 4 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Tap key={o.value} onPress={() => onChange(o.value)} accessibilityRole="radio" accessibilityState={{ selected: on }} className="flex-1 items-center rounded-2xl py-3.5" style={{ backgroundColor: on ? C.fill : 'transparent' }}>
            <Text className={`text-[14px] font-bold ${on ? 'text-ink' : 'text-sub'}`}>{o.label}</Text>
          </Tap>
        );
      })}
    </View>
  );
}

export function Field({ label, suffix, prefix, ...props }: TextInputProps & { label: string; suffix?: string; prefix?: string }) {
  return (
    <View style={{ gap: 8 }} className="flex-1">
      <Text className="px-1 text-[13px] font-semibold text-sub">{label}</Text>
      <View className="flex-row items-center rounded-[20px] border border-line bg-raised px-5">
        {prefix ? <Text className="mr-1.5 text-[18px] font-semibold text-dim">{prefix}</Text> : null}
        <TextInput accessibilityLabel={suffix ? `${label} in ${suffix}` : label} placeholderTextColor={C.dim} selectionColor={C.accent} cursorColor={C.accent} className="flex-1 py-4 text-[18px] font-semibold text-ink" {...props} />
        {suffix ? <Text className="ml-1.5 text-[15px] font-semibold text-dim">{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Stat({ label, value, sub, color = C.ink }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View className="flex-1" style={{ gap: 4 }} accessible accessibilityLabel={[label, value, sub].filter(Boolean).join(', ')}>
      <Text className="text-[12px] font-semibold text-dim">{label}</Text>
      <Text style={{ color }} className="text-[22px] font-extrabold tracking-tight" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? <Text className="text-[12px] text-sub">{sub}</Text> : null}
    </View>
  );
}

export function Check({ on, color = C.accent, size = 28 }: { on: boolean; color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: on ? color : C.line, backgroundColor: on ? color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {on ? <Ionicons name="checkmark" size={size * 0.6} color={C.ink} /> : null}
    </View>
  );
}

/** Small "i" button that reveals a tip, so screens stay clean by default. */
export function Tip({ text, open, onToggle }: { text: string; open: boolean; onToggle: () => void }) {
  return (
    <View style={{ gap: 10 }}>
      <Tap onPress={onToggle} hitSlop={12} accessibilityLabel={open ? 'Hide tip' : 'Show tip'} accessibilityState={{ expanded: open }} className="flex-row items-center self-start" style={{ gap: 6 }}>
        <Ionicons name={open ? 'close-circle' : 'information-circle-outline'} size={16} color={C.dim} />
        <Text className="text-[13px] font-semibold text-dim">{open ? 'Hide tip' : 'Tip'}</Text>
      </Tap>
      {open ? <Text className="text-[14px] leading-[21px] text-sub">{text}</Text> : null}
    </View>
  );
}
