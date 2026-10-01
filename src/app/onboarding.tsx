import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityPicker, BodyFields, SexPicker, bodyError, emptyForm, formToProfile, type ProfileFormValue } from '@/components/profile-form';
import { Button, C, Field, GUTTER, IconButton, Segmented, haptic } from '@/components/ui';
import { dateKey } from '@/lib/date';
import { parseNum } from '@/lib/format';
import { useStore, type PaySchedule } from '@/lib/store';

const STEPS = [
  { title: 'Hey there', sub: 'Let’s set you up.' },
  { title: 'Your body', sub: 'For your BMI and calories.' },
  { title: 'Activity', sub: 'Outside of workouts.' },
  { title: 'Your money', sub: 'Daily budgets in pesos.' },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const saveProfile = useStore((s) => s.saveProfile);
  const setSettings = useStore((s) => s.setSettings);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileFormValue>(emptyForm);
  const [food, setFood] = useState('200');
  const [daily, setDaily] = useState('350');
  const [salary, setSalary] = useState('');
  const [schedule, setSchedule] = useState<PaySchedule>('kinsenas');
  const [error, setError] = useState('');

  const fail = (msg: string) => {
    haptic.warn();
    setError(msg);
  };

  const next = () => {
    if (step === 1) {
      const err = bodyError(form);
      if (err) return fail(err);
    }
    if (step < STEPS.length - 1) {
      setError('');
      haptic.tap();
      return setStep(step + 1);
    }
    const profile = formToProfile(form);
    if (typeof profile === 'string') return fail(profile);
    const foodBudget = parseNum(food);
    if (!(foodBudget >= 80)) return fail('Food budget should be at least ₱80.');
    const dailyBudget = parseNum(daily);
    saveProfile(profile, dateKey());
    setSettings({
      foodBudget,
      defaultDailyBudget: dailyBudget > 0 ? dailyBudget : 350,
      salary: parseNum(salary) > 0 ? parseNum(salary) : 0,
      paySchedule: schedule,
    });
    haptic.success();
    router.replace('/');
  };

  const back = () => {
    setError('');
    setStep(step - 1);
  };

  // Android back button/gesture steps back through the wizard instead of exiting.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 0) return false;
      setError('');
      setStep((s) => s - 1);
      return true;
    });
    return () => sub.remove();
  }, [step]);

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: GUTTER, gap: 28 }}>
        <View className="flex-row items-center" style={{ gap: 14 }}>
          {step > 0 ? <IconButton icon="chevron-back" onPress={back} /> : <View style={{ width: 44, height: 44 }} />}
          <View className="flex-1 flex-row" style={{ gap: 6 }}>
            {STEPS.map((_, i) => (
              <View key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i <= step ? C.accent : C.raised }} />
            ))}
          </View>
          <Text className="w-11 text-right text-[13px] font-bold text-dim">
            {step + 1}/{STEPS.length}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 32, paddingBottom: 24 }}>
        <Animated.View key={step} entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)} style={{ gap: 28 }}>
          <View style={{ gap: 6 }}>
            <Text className="text-[34px] font-extrabold tracking-tight text-ink">
              {STEPS[step].title}
              <Text className="text-accent">.</Text>
            </Text>
            <Text className="text-[16px] text-sub">{STEPS[step].sub}</Text>
          </View>

          {step === 0 ? (
            <View style={{ gap: 24 }}>
              <View style={{ gap: 8 }}>
                <Text className="px-1 text-[13px] font-semibold text-sub">Name</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(name) => setForm({ ...form, name })}
                  placeholder="Your name"
                  placeholderTextColor={C.dim}
                  selectionColor={C.accent}
                  cursorColor={C.accent}
                  autoCapitalize="words"
                  returnKeyType="next"
                  className="rounded-[20px] border border-line bg-raised px-5 py-4 text-[18px] font-semibold text-ink"
                />
              </View>
              <SexPicker value={form} onChange={setForm} />
            </View>
          ) : null}

          {step === 1 ? <BodyFields value={form} onChange={setForm} /> : null}

          {step === 2 ? <ActivityPicker value={form} onChange={setForm} /> : null}

          {step === 3 ? (
            <View style={{ gap: 20 }}>
              <View className="flex-row" style={{ gap: 12 }}>
                <Field label="Food / day" prefix="₱" keyboardType="number-pad" value={food} onChangeText={setFood} />
                <Field label="Spending / day" prefix="₱" keyboardType="number-pad" value={daily} onChangeText={setDaily} />
              </View>
              <Field label="Monthly salary (optional)" prefix="₱" keyboardType="number-pad" value={salary} onChangeText={setSalary} placeholder="18,000" />
              <View style={{ gap: 8 }}>
                <Text className="px-1 text-[13px] font-semibold text-sub">Payday</Text>
                <Segmented
                  value={schedule}
                  onChange={setSchedule}
                  options={[
                    { value: 'kinsenas', label: '15th & 30th' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                />
              </View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* Pinned footer: the Next button is always visible, even with the keyboard open. */}
      <View style={{ paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: insets.bottom + 16, gap: 12, backgroundColor: C.bg }}>
        {error ? <Text className="text-center text-[14px] font-semibold text-glow">{error}</Text> : null}
        <Button label={step === STEPS.length - 1 ? 'Start' : 'Next'} icon={step === STEPS.length - 1 ? 'checkmark' : 'arrow-forward'} onPress={next} />
      </View>
    </KeyboardAvoidingView>
  );
}
