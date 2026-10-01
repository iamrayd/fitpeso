import { Text, View } from 'react-native';

import { ACTIVITY, type Activity } from '@/lib/fitness';
import { parseNum } from '@/lib/format';
import type { Profile } from '@/lib/store';
import { Card, Check, Field, Segmented, Tap } from './ui';

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

/** Returns a Profile, or an error message to show. */
export function formToProfile(f: ProfileFormValue): Profile | string {
  const age = parseNum(f.age);
  const heightCm = parseNum(f.height);
  const weightKg = parseNum(f.weight);
  const waist = f.waist.trim() ? parseNum(f.waist) : null;
  if (!(age >= 13 && age <= 90)) return 'Enter your age (13–90).';
  if (!(heightCm >= 120 && heightCm <= 230)) return 'Enter your height in cm (e.g. 170).';
  if (!(weightKg >= 30 && weightKg <= 250)) return 'Enter your weight in kg (e.g. 60).';
  if (waist !== null && !(waist >= 40 && waist <= 200)) return 'Waist should be in cm (e.g. 80), or leave it blank.';
  return { name: f.name.trim() || 'Friend', sex: f.sex, age: Math.round(age), heightCm, weightKg, waistCm: waist, activity: f.activity };
}

export function ProfileForm({ value: f, onChange }: { value: ProfileFormValue; onChange: (v: ProfileFormValue) => void }) {
  const set = (patch: Partial<ProfileFormValue>) => onChange({ ...f, ...patch });
  return (
    <>
      <Card>
        <View style={{ gap: 14 }}>
          <Text className="text-[17px] font-bold text-ink">About you</Text>
          <Field label="Name" value={f.name} onChangeText={(name) => set({ name })} placeholder="Ray" autoCapitalize="words" />
          <Segmented
            value={f.sex}
            onChange={(sex) => set({ sex })}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
          />
          <View className="flex-row" style={{ gap: 10 }}>
            <Field label="Age" keyboardType="number-pad" value={f.age} onChangeText={(age) => set({ age })} placeholder="25" />
            <Field label="Height" suffix="cm" keyboardType="decimal-pad" value={f.height} onChangeText={(height) => set({ height })} placeholder="170" />
          </View>
          <View className="flex-row" style={{ gap: 10 }}>
            <Field label="Weight" suffix="kg" keyboardType="decimal-pad" value={f.weight} onChangeText={(weight) => set({ weight })} placeholder="60" />
            <Field label="Waist" suffix="cm" keyboardType="decimal-pad" value={f.waist} onChangeText={(waist) => set({ waist })} placeholder="80" />
          </View>
          <Text className="px-1 text-[12px] leading-[17px] text-dim">
            Measure your waist at the belly button, relaxed, after breathing out. It tracks belly fat much better than the scale.
          </Text>
        </View>
      </Card>

      <Card>
        <View style={{ gap: 10 }}>
          <Text className="text-[17px] font-bold text-ink">Activity</Text>
          {(Object.keys(ACTIVITY) as Activity[]).map((k) => (
            <Tap key={k} haptics="pick" onPress={() => set({ activity: k })} className={`flex-row items-center rounded-2xl border p-3.5 ${f.activity === k ? 'border-lime bg-lime/10' : 'border-line bg-raised'}`} style={{ gap: 12 }}>
              <Check on={f.activity === k} size={22} />
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-ink">{ACTIVITY[k].label}</Text>
                <Text className="text-[13px] text-sub">{ACTIVITY[k].hint}</Text>
              </View>
            </Tap>
          ))}
        </View>
      </Card>
    </>
  );
}
