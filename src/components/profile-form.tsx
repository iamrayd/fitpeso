import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { ACTIVITY, type Activity } from '@/lib/fitness';
import { parseNum } from '@/lib/format';
import type { Profile } from '@/lib/store';
import { C, Field, OptionCard, Tap, type IconName } from './ui';

export type ProfileFormValue = {
  name: string;
  sex: Profile['sex'];
  age: string;
  height: string;
  weight: string;
  waist: string;
  activity: Activity;
};

export const emptyForm: ProfileFormValue = { name: '', sex: 'male', age: '', height: '', weight: '', waist: '', activity: 'light' };

export function profileToForm(p: Profile): ProfileFormValue {
  return {
    name: p.name,
    sex: p.sex,
    age: String(p.age),
    height: String(p.heightCm),
    weight: String(p.weightKg),
    waist: p.waistCm ? String(p.waistCm) : '',
    activity: p.activity,
  };
}

/** Error message for the body numbers, or null when they're valid. */
export function bodyError(f: ProfileFormValue): string | null {
  const age = parseNum(f.age);
  const height = parseNum(f.height);
  const weight = parseNum(f.weight);
  if (!(age >= 13 && age <= 90)) return 'Enter your age (13–90).';
  if (!(height >= 120 && height <= 230)) return 'Enter your height in cm.';
  if (!(weight >= 30 && weight <= 250)) return 'Enter your weight in kg.';
  if (f.waist.trim() && !(parseNum(f.waist) >= 40 && parseNum(f.waist) <= 200)) return 'Waist should be in cm, or leave it blank.';
  return null;
}

/** Returns a Profile, or an error message to show. */
export function formToProfile(f: ProfileFormValue): Profile | string {
  const err = bodyError(f);
  if (err) return err;
  return {
    name: f.name.trim() || 'Friend',
    sex: f.sex,
    age: Math.round(parseNum(f.age)),
    heightCm: parseNum(f.height),
    weightKg: parseNum(f.weight),
    waistCm: f.waist.trim() ? parseNum(f.waist) : null,
    activity: f.activity,
  };
}

type Props = { value: ProfileFormValue; onChange: (v: ProfileFormValue) => void };

/** Two centered tiles side by side, capped in width so they never stretch too wide. */
export function SexPicker({ value: f, onChange }: Props) {
  const options: { key: Profile['sex']; label: string; icon: IconName }[] = [
    { key: 'male', label: 'Male', icon: 'male' },
    { key: 'female', label: 'Female', icon: 'female' },
  ];
  return (
    <View className="w-full flex-row self-center" style={{ maxWidth: 360, gap: 14 }}>
      {options.map((o) => {
        const on = f.sex === o.key;
        return (
          <Tap
            key={o.key}
            onPress={() => onChange({ ...f, sex: o.key })}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            className="flex-1 items-center rounded-[26px] border-2 px-4 py-7"
            style={{ gap: 14, borderColor: on ? C.accent : C.line, backgroundColor: on ? 'rgba(226,35,45,0.10)' : C.card }}>
            <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: on ? C.accent : C.raised }}>
              <Ionicons name={o.icon} size={30} color={C.ink} />
            </View>
            <Text className="text-[17px] font-bold" style={{ color: on ? C.ink : C.sub }}>
              {o.label}
            </Text>
          </Tap>
        );
      })}
    </View>
  );
}

export function BodyFields({ value: f, onChange }: Props) {
  const set = (patch: Partial<ProfileFormValue>) => onChange({ ...f, ...patch });
  return (
    <View style={{ gap: 16 }}>
      <View className="flex-row" style={{ gap: 12 }}>
        <Field label="Age" keyboardType="number-pad" value={f.age} onChangeText={(age) => set({ age })} placeholder="25" />
        <Field label="Height" suffix="cm" keyboardType="decimal-pad" value={f.height} onChangeText={(height) => set({ height })} placeholder="170" />
      </View>
      <View className="flex-row" style={{ gap: 12 }}>
        <Field label="Weight" suffix="kg" keyboardType="decimal-pad" value={f.weight} onChangeText={(weight) => set({ weight })} placeholder="60" />
        <Field label="Waist (optional)" suffix="cm" keyboardType="decimal-pad" value={f.waist} onChangeText={(waist) => set({ waist })} placeholder="80" />
      </View>
    </View>
  );
}

const ACTIVITY_ICON: Record<Activity, IconName> = { sedentary: 'desktop-outline', light: 'walk-outline', moderate: 'flame-outline' };

export function ActivityPicker({ value: f, onChange }: Props) {
  return (
    <View style={{ gap: 12 }}>
      {(Object.keys(ACTIVITY) as Activity[]).map((k) => (
        <OptionCard key={k} icon={ACTIVITY_ICON[k]} title={ACTIVITY[k].label} hint={ACTIVITY[k].hint} selected={f.activity === k} onPress={() => onChange({ ...f, activity: k })} />
      ))}
    </View>
  );
}
