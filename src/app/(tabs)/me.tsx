import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

import { BackupCard } from '@/components/backup-card';
import { RemindersCard } from '@/components/reminders-card';
import { ActivityPicker, BodyFields, SexPicker, formToProfile, profileToForm } from '@/components/profile-form';
import { Button, C, Card, Field, Header, Label, Screen, SectionTitle, Segmented, Stat, Tap } from '@/components/ui';
import { prettyDate } from '@/lib/date';
import { ACTIVITY, BMI_BANDS, bmi, bmiCategory, tdee, whtr, whtrCategory } from '@/lib/fitness';
import { clamp, parseNum } from '@/lib/format';
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
    if (!(kg >= 30 && kg <= 250) || (cm !== null && !(cm >= 40 && cm <= 200))) return;
    s.logBody({ day: today, weightKg: kg, waistCm: cm });
  };

  const saveProfile = () => {
    const p = formToProfile(form);
    if (typeof p === 'string') {
      return setFormError(p);
    }
    s.saveProfile(p, today);
    setWeight(String(p.weightKg));
    setWaist(p.waistCm ? String(p.waistCm) : '');
    setFormError('');
    setEditing(false);
  };

  const recent = [...body].reverse().slice(0, 6);
  const series = body.slice(-14);

  return (
    <Screen>
      <Header eyebrow={profile.name} title="Me" />

      <Card>
        <View style={{ gap: 18 }}>
          <View className="flex-row items-end justify-between">
            <View style={{ gap: 2 }}>
              <Label>BMI</Label>
              <Text style={{ color: bc.color }} className="text-[48px] font-extrabold tracking-tight">
                {b.toFixed(1)}
              </Text>
            </View>
            <Text style={{ color: bc.color }} className="pb-3 text-[18px] font-bold">
              {bc.label}
            </Text>
          </View>
          <View>
            <View className="h-2.5 flex-row overflow-hidden rounded-full">
              {BMI_BANDS.map(([a, z, col]) => (
                <View key={a} style={{ flex: z - a, backgroundColor: col, opacity: 0.9 }} />
              ))}
            </View>
            <View style={{ position: 'absolute', left: `${markerPct}%`, top: -6, marginLeft: -11, width: 22, height: 22, borderRadius: 11, backgroundColor: C.ink, borderWidth: 5, borderColor: C.card }} />
            <View className="mt-2.5 flex-row justify-between">
              {[GAUGE_MIN, 18.5, 23, 25, GAUGE_MAX].map((v) => (
                <Text key={v} className="text-[11px] text-dim">
                  {v}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ gap: 16 }}>
          <Label>Belly fat</Label>
          {w ? (
            <View className="flex-row" style={{ gap: 12 }}>
              <Stat label="Waist" value={`${profile.waistCm} cm`} />
              <Stat label="Waist/height" value={w.toFixed(2)} color={whtrCategory(w).color} sub={whtrCategory(w).label} />
              <Stat label="Goal" value={`<${waistGoal} cm`} color={C.glow} sub={profile.waistCm! > waistGoal ? `${(profile.waistCm! - waistGoal).toFixed(1)} cm to go` : 'Reached'} />
            </View>
          ) : (
            <Text className="text-[15px] text-sub">Log your waist below to track it.</Text>
          )}
        </View>
      </Card>

      <Card>
        <View style={{ gap: 16 }}>
          <Label right={<Text className="text-[12px] text-dim">maintenance {Math.round(tdee(profile))}</Text>}>Daily targets</Label>
          <View className="flex-row" style={{ gap: 12 }}>
            <Stat label="Calories" value={`${t.kcal}`} color={C.glow} />
            <Stat label="Protein" value={`${t.protein}g`} />
            <Stat label="Carbs" value={`${t.carbs}g`} />
            <Stat label="Fat" value={`${t.fat}g`} />
          </View>
        </View>
      </Card>

      <SectionTitle>Progress</SectionTitle>
      <Card>
        <View style={{ gap: 16 }}>
          <View className="flex-row" style={{ gap: 12 }}>
            <Field label="Weight" suffix="kg" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
            <Field label="Waist" suffix="cm" keyboardType="decimal-pad" value={waist} onChangeText={setWaist} placeholder="—" />
          </View>
          <Button label={todays ? 'Update today' : 'Log today'} icon="add" small onPress={logToday} />
          {series.length >= 2 ? <Sparkline values={series.map((x) => x.weightKg)} /> : null}
          {recent.length ? (
            <View style={{ gap: 10 }}>
              {recent.map((x, i) => {
                const prev = recent[i + 1];
                const d = prev ? x.weightKg - prev.weightKg : 0;
                return (
                  <View key={x.day} className="flex-row items-center justify-between border-t border-line pt-3">
                    <Text className="text-[14px] text-sub">{prettyDate(x.day)}</Text>
                    <Text className="text-[14px] font-semibold text-ink">
                      {x.weightKg} kg{x.waistCm ? ` · ${x.waistCm} cm` : ''}
                      {prev && d !== 0 ? <Text style={{ color: d < 0 ? C.accent : C.warn }}>{`  ${d > 0 ? '+' : ''}${d.toFixed(1)}`}</Text> : null}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </Card>

      <SectionTitle
        right={
          <Tap hitSlop={12} accessibilityLabel={editing ? 'Cancel editing profile' : 'Edit profile'} onPress={() => { setForm(profileToForm(profile)); setFormError(''); setEditing((e) => !e); }}>
            <Text className="text-[14px] font-bold text-glow">{editing ? 'Cancel' : 'Edit'}</Text>
          </Tap>
        }>
        Profile
      </SectionTitle>
      {editing ? (
        <Animated.View entering={FadeIn} layout={LinearTransition} style={{ gap: 20 }}>
          <Field label="Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} autoCapitalize="words" />
          <SexPicker value={form} onChange={setForm} />
          <BodyFields value={form} onChange={setForm} />
          <ActivityPicker value={form} onChange={setForm} />
          {formError ? <Text className="px-1 text-[14px] font-semibold text-glow">{formError}</Text> : null}
          <Button label="Save profile" icon="checkmark" onPress={saveProfile} />
        </Animated.View>
      ) : (
        <Card>
          <View className="flex-row" style={{ gap: 12 }}>
            <Stat label="Age" value={`${profile.age}`} />
            <Stat label="Height" value={`${profile.heightCm} cm`} />
            <Stat label="Activity" value={ACTIVITY[profile.activity].label.split(' ')[0]} />
          </View>
        </Card>
      )}

      <SectionTitle>Reminders</SectionTitle>
      <RemindersCard />

      <SectionTitle>Settings</SectionTitle>
      <Card>
        <View style={{ gap: 24 }}>
          <View style={{ gap: 10 }}>
            <Text className="text-[16px] font-bold text-ink">Market prices</Text>
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

          <View className="flex-row items-center justify-between" style={{ gap: 16 }}>
            <View className="flex-1" style={{ gap: 2 }}>
              <Text className="text-[16px] font-bold text-ink">Auto-log meal costs</Text>
              <Text className="text-[13px] text-sub">Eaten meals go to Wallet</Text>
            </View>
            <Switch value={s.autoLogMeals} onValueChange={(v) => { s.setSettings({ autoLogMeals: v }); }} trackColor={{ true: C.accent, false: C.raised }} thumbColor={C.ink} />
          </View>

          <View style={{ gap: 10 }}>
            <Text className="text-[16px] font-bold text-ink">Payday</Text>
            <Segmented
              value={s.paySchedule}
              onChange={(v: PaySchedule) => s.setSettings({ paySchedule: v })}
              options={[
                { value: 'kinsenas', label: '15th & 30th' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
          </View>

          <View className="flex-row" style={{ gap: 12 }}>
            <Field label="Salary / month" prefix="₱" keyboardType="number-pad" value={salaryDraft} onChangeText={setSalaryDraft} placeholder="0" />
            <Field label="Budget / day" prefix="₱" keyboardType="number-pad" value={dailyDraft} onChangeText={setDailyDraft} />
          </View>
          <Button
            small
            variant="ghost"
            label="Save money settings"
            onPress={() => {
              const sal = parseNum(salaryDraft);
              const daily = parseNum(dailyDraft);
              s.setSettings({ salary: sal > 0 ? sal : 0, defaultDailyBudget: daily > 0 ? daily : s.defaultDailyBudget });
            }}
          />
        </View>
      </Card>

      <SectionTitle>Your data</SectionTitle>
      <BackupCard />

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
      <Text className="text-center text-[12px] text-dim">Your data stays on this phone.</Text>
    </Screen>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const [w, setW] = useState(0);
  const h = 60;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 8) + 4, h - 6 - ((v - min) / span) * (h - 12)] as const);
  const last = pts[pts.length - 1];
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: h }}>
      {w > 0 ? (
        <Svg width={w} height={h}>
          <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          <Circle cx={last[0]} cy={last[1]} r={4} fill={C.accent} />
        </Svg>
      ) : null}
    </View>
  );
}
