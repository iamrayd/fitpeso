import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

import { ProfileForm, formToProfile, profileToForm } from '@/components/profile-form';
import { Button, C, Card, Field, Header, Screen, SectionTitle, Segmented, Stat, Tap, haptic } from '@/components/ui';
import { prettyDate } from '@/lib/date';
import { ACTIVITY, BMI_BANDS, bmi, bmiCategory, tdee, whtr, whtrCategory } from '@/lib/fitness';
import { clamp, parseNum, peso } from '@/lib/format';
import { useTargets, useToday } from '@/lib/hooks';
import { useStore, type PaySchedule } from '@/lib/store';

const GAUGE_MIN = BMI_BANDS[0][0];
const GAUGE_MAX = BMI_BANDS[BMI_BANDS.length - 1][1];

export default function Me() {
  const today = useToday();
  const profile = useStore((s) => s.profile)!;
  const body = useStore((s) => s.body);
  const s = useStore(
    useShallow((st) => ({
      priceFactor: st.priceFactor,
      autoLogMeals: st.autoLogMeals,
      paySchedule: st.paySchedule,
      salary: st.salary,
      defaultDailyBudget: st.defaultDailyBudget,
      foodBudget: st.foodBudget,
      logBody: st.logBody,
      saveProfile: st.saveProfile,
      setSettings: st.setSettings,
      resetAll: st.resetAll,
    })),
  );
  const t = useTargets()!;

  const b = bmi(profile);
  const bc = bmiCategory(b);
  const w = whtr(profile);
  const waistGoal = Math.round(profile.heightCm * 0.5);
  const markerPct = ((clamp(b, GAUGE_MIN, GAUGE_MAX) - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100;

  const todays = body.find((x) => x.day === today);
  const [weight, setWeight] = useState(String(todays?.weightKg ?? profile.weightKg));
  const [waist, setWaist] = useState(todays?.waistCm ? String(todays.waistCm) : profile.waistCm ? String(profile.waistCm) : '');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => profileToForm(profile));
  const [formError, setFormError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [dailyDraft, setDailyDraft] = useState(String(s.defaultDailyBudget));
  const [salaryDraft, setSalaryDraft] = useState(s.salary ? String(s.salary) : '');

  useEffect(() => {
    if (!confirmReset) return;
    const id = setTimeout(() => setConfirmReset(false), 4000);
    return () => clearTimeout(id);
  }, [confirmReset]);

  const logToday = () => {
    const kg = parseNum(weight);
    const cm = waist.trim() ? parseNum(waist) : null;
    if (!(kg >= 30 && kg <= 250) || (cm !== null && !(cm >= 40 && cm <= 200))) return haptic.warn();
    s.logBody({ day: today, weightKg: kg, waistCm: cm });
    haptic.success();
  };

  const saveProfile = () => {
    const p = formToProfile(form);
    if (typeof p === 'string') {
      haptic.warn();
      return setFormError(p);
    }
    s.saveProfile(p, today);
    setWeight(String(p.weightKg));
    setWaist(p.waistCm ? String(p.waistCm) : '');
    setFormError('');
    setEditing(false);
    haptic.success();
  };

  const recent = [...body].reverse().slice(0, 8);
  const series = body.slice(-14);

  return (
    <Screen>
      <Header eyebrow={profile.name} title="Me" />

      <Card>
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-[12px] font-bold uppercase tracking-wider text-sub">Body mass index</Text>
            <Text style={{ color: bc.color }} className="text-[44px] font-extrabold tracking-tight">
              {b.toFixed(1)}
            </Text>
          </View>
          <View className="items-end pb-2">
            <Text style={{ color: bc.color }} className="text-[17px] font-bold">
              {bc.label}
            </Text>
            <Text className="text-[12px] text-dim">
              {profile.weightKg} kg · {profile.heightCm} cm
            </Text>
          </View>
        </View>
        <View className="mt-2">
          <View className="h-3 flex-row overflow-hidden rounded-full">
            {BMI_BANDS.map(([a, z, col]) => (
              <View key={a} style={{ flex: z - a, backgroundColor: col, opacity: 0.85 }} />
            ))}
          </View>
          <View style={{ position: 'absolute', left: `${markerPct}%`, top: -4, marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: C.ink, borderWidth: 4, borderColor: C.card }} />
          <View className="mt-1.5 flex-row justify-between">
            {[GAUGE_MIN, 18.5, 23, 25, GAUGE_MAX].map((v) => (
              <Text key={v} className="text-[10px] text-dim">
                {v}
              </Text>
            ))}
          </View>
        </View>
        <Text className="mt-3 text-[13px] leading-[19px] text-sub">{bc.note}</Text>
        <Text className="mt-1 text-[11px] leading-[16px] text-dim">Uses Asia-Pacific cut-offs (normal is 18.5–22.9), which fit Filipino bodies better than the global ones.</Text>
      </Card>

      <Card>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Ionicons name="body-outline" size={18} color={C.lime} />
          <Text className="text-[12px] font-bold uppercase tracking-wider text-sub">Belly fat tracker</Text>
        </View>
        {w ? (
          <>
            <View className="mt-3 flex-row" style={{ gap: 12 }}>
              <Stat label="Waist" value={`${profile.waistCm} cm`} />
              <Stat label="Waist / height" value={w.toFixed(2)} color={whtrCategory(w).color} sub={whtrCategory(w).label} />
              <Stat label="Goal" value={`< ${waistGoal} cm`} sub={profile.waistCm! > waistGoal ? `${(profile.waistCm! - waistGoal).toFixed(1)} cm to go` : 'Reached!'} color={C.mint} />
            </View>
            <Text className="mt-3 text-[12px] leading-[17px] text-dim">
              BMI can call a skinny-fat body “normal”. Waist-to-height is what matters for belly fat: keep your waist under half your height. Measure once a week, same time, before eating.
            </Text>
          </>
        ) : (
          <Text className="mt-2 text-[14px] leading-[20px] text-sub">Add your waist below (measured at the belly button). It’s the best way to see belly fat going down, even when the scale doesn’t move.</Text>
        )}
      </Card>

      <Card>
        <Text className="text-[12px] font-bold uppercase tracking-wider text-sub">Daily targets</Text>
        <View className="mt-3 flex-row" style={{ gap: 12 }}>
          <Stat label="Calories" value={`${t.kcal}`} color={C.lime} sub={`maint. ${Math.round(tdee(profile))}`} />
          <Stat label="Protein" value={`${t.protein} g`} sub="most important" />
          <Stat label="Carbs" value={`${t.carbs} g`} />
          <Stat label="Fat" value={`${t.fat} g`} />
        </View>
        <Text className="mt-3 text-[12px] leading-[17px] text-dim">
          {b < 18.5
            ? 'You are lean, so you eat at maintenance and build muscle. The training flattens the belly.'
            : 'A gentle deficit with high protein (about 1.8 g per kg) loses fat while keeping muscle. Don\'t crash diet: on a slim frame that burns muscle and makes skinny-fat worse.'}{' '}
          Activity: {ACTIVITY[profile.activity].label.toLowerCase()}.
        </Text>
      </Card>

      <SectionTitle>Progress log</SectionTitle>
      <Card>
        <View className="flex-row items-end" style={{ gap: 10 }}>
          <Field label="Weight" suffix="kg" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
          <Field label="Waist" suffix="cm" keyboardType="decimal-pad" value={waist} onChangeText={setWaist} placeholder="—" />
        </View>
        <View className="mt-3">
          <Button label={todays ? 'Update today' : 'Log today'} icon="add" small onPress={logToday} />
        </View>
        {series.length >= 2 ? <Sparkline values={series.map((x) => x.weightKg)} /> : null}
        {recent.length ? (
          <View className="mt-3" style={{ gap: 8 }}>
            {recent.map((x, i) => {
              const prev = recent[i + 1];
              const d = prev ? x.weightKg - prev.weightKg : 0;
              return (
                <View key={x.day} className="flex-row items-center justify-between border-t border-line pt-2">
                  <Text className="text-[13px] text-sub">{prettyDate(x.day)}</Text>
                  <Text className="text-[13px] font-semibold text-ink">
                    {x.weightKg} kg{x.waistCm ? ` · ${x.waistCm} cm` : ''}
                    {prev && d !== 0 ? <Text style={{ color: d < 0 ? C.mint : C.amber }}>{`  ${d > 0 ? '+' : ''}${d.toFixed(1)}`}</Text> : null}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </Card>

      <SectionTitle right={<Tap haptics="pick" onPress={() => { setForm(profileToForm(profile)); setEditing((e) => !e); }}><Text className="text-[13px] font-bold text-lime">{editing ? 'Cancel' : 'Edit'}</Text></Tap>}>Profile</SectionTitle>
      {editing ? (
        <Animated.View entering={FadeIn} layout={LinearTransition} style={{ gap: 14 }}>
          <ProfileForm value={form} onChange={setForm} />
          {formError ? <Text className="px-1 text-[14px] font-semibold text-rose">{formError}</Text> : null}
          <Button label="Save profile" icon="checkmark" onPress={saveProfile} />
        </Animated.View>
      ) : (
        <Card>
          <View className="flex-row" style={{ gap: 12 }}>
            <Stat label="Age" value={`${profile.age}`} />
            <Stat label="Sex" value={profile.sex === 'male' ? 'Male' : 'Female'} />
            <Stat label="Activity" value={ACTIVITY[profile.activity].label.split(' ')[0]} />
          </View>
        </Card>
      )}

      <SectionTitle>Settings</SectionTitle>
      <Card>
        <View style={{ gap: 16 }}>
          <View style={{ gap: 8 }}>
            <Text className="text-[15px] font-bold text-ink">Market prices</Text>
            <Text className="text-[12px] leading-[17px] text-dim">If palengke prices go up or down, adjust every meal cost at once.</Text>
            <Segmented
              value={String(s.priceFactor)}
              onChange={(v) => s.setSettings({ priceFactor: Number(v) })}
              options={[
                { value: '0.9', label: '-10%' },
                { value: '1', label: 'Normal' },
                { value: '1.1', label: '+10%' },
                { value: '1.25', label: '+25%' },
              ]}
            />
          </View>

          <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-ink">Auto-log meal costs</Text>
              <Text className="text-[12px] leading-[17px] text-dim">Checking off a meal adds its cost to Wallet. Leave this off if you log your palengke trips instead, so nothing is counted twice.</Text>
            </View>
            <Switch value={s.autoLogMeals} onValueChange={(v) => { haptic.pick(); s.setSettings({ autoLogMeals: v }); }} trackColor={{ true: C.lime, false: C.raised }} thumbColor={C.ink} />
          </View>

          <View style={{ gap: 8 }}>
            <Text className="text-[15px] font-bold text-ink">Payday</Text>
            <Segmented
              value={s.paySchedule}
              onChange={(v: PaySchedule) => s.setSettings({ paySchedule: v })}
              options={[
                { value: 'kinsenas', label: '15th & 30th' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
          </View>

          <View className="flex-row items-end" style={{ gap: 10 }}>
            <Field label="Monthly salary" prefix="₱" keyboardType="number-pad" value={salaryDraft} onChangeText={setSalaryDraft} placeholder="0" />
            <Field label="Daily budget" prefix="₱" keyboardType="number-pad" value={dailyDraft} onChangeText={setDailyDraft} />
          </View>
          <Button
            small
            variant="ghost"
            label={`Save money settings`}
            onPress={() => {
              const sal = parseNum(salaryDraft);
              const daily = parseNum(dailyDraft);
              s.setSettings({ salary: sal > 0 ? sal : 0, defaultDailyBudget: daily > 0 ? daily : s.defaultDailyBudget });
              haptic.success();
            }}
          />
          <Text className="text-[12px] text-dim">
            Food budget: {peso(s.foodBudget)}/day (change it on the Meals tab).
          </Text>
        </View>
      </Card>

      <Button
        variant="danger"
        icon="trash-outline"
        label={confirmReset ? 'Tap again to erase everything' : 'Reset all data'}
        onPress={() => {
          if (!confirmReset) return setConfirmReset(true);
          s.resetAll();
          router.replace('/onboarding');
        }}
      />
      <Text className="text-center text-[11px] text-dim">FitPeso keeps all your data on this phone. Nothing is uploaded.</Text>
    </Screen>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const [w, setW] = useState(0);
  const h = 56;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 8) + 4, h - 6 - ((v - min) / span) * (h - 12)] as const);
  const last = pts[pts.length - 1];
  return (
    <View className="mt-4" onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: h }}>
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.lime} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={last[0]} cy={last[1]} r={4} fill={C.lime} />
        </Svg>
      ) : null}
    </View>
  );
}
