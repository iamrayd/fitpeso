import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { ProfileForm, emptyForm, formToProfile, type ProfileFormValue } from '@/components/profile-form';
import { Button, Card, Field, Screen, Segmented, haptic } from '@/components/ui';
import { dateKey } from '@/lib/date';
import { parseNum } from '@/lib/format';
import { useStore, type PaySchedule } from '@/lib/store';

export default function Onboarding() {
  const saveProfile = useStore((s) => s.saveProfile);
  const setSettings = useStore((s) => s.setSettings);
  const [form, setForm] = useState<ProfileFormValue>(emptyForm);
  const [food, setFood] = useState('200');
  const [daily, setDaily] = useState('350');
  const [salary, setSalary] = useState('');
  const [schedule, setSchedule] = useState<PaySchedule>('kinsenas');
  const [error, setError] = useState('');

  const submit = () => {
    const result = formToProfile(form);
    if (typeof result === 'string') {
      haptic.warn();
      return setError(result);
    }
    const foodBudget = parseNum(food);
    const dailyBudget = parseNum(daily);
    if (!(foodBudget >= 80)) {
      haptic.warn();
      return setError('Set a food budget of at least ₱80 a day.');
    }
    saveProfile(result, dateKey());
    setSettings({
      foodBudget,
      defaultDailyBudget: dailyBudget > 0 ? dailyBudget : 350,
      salary: parseNum(salary) > 0 ? parseNum(salary) : 0,
      paySchedule: schedule,
    });
    haptic.success();
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View className="mb-2 mt-6" style={{ gap: 8 }}>
          <Text className="text-[15px] font-bold uppercase tracking-widest text-lime">FitPeso</Text>
          <Text className="text-[34px] font-extrabold leading-[38px] tracking-tight text-ink">Lose the belly.{'\n'}Keep your peso.</Text>
          <Text className="text-[15px] leading-[22px] text-sub">
            A few numbers about you to work out your BMI, daily calories, macros and a Cebu-budget meal plan.
          </Text>
        </View>

        <ProfileForm value={form} onChange={setForm} />

        <Card>
          <View style={{ gap: 14 }}>
            <Text className="text-[17px] font-bold text-ink">Money</Text>
            <View className="flex-row" style={{ gap: 10 }}>
              <Field label="Food / day" prefix="₱" keyboardType="number-pad" value={food} onChangeText={setFood} />
              <Field label="Spending / day" prefix="₱" keyboardType="number-pad" value={daily} onChangeText={setDaily} />
            </View>
            <Field label="Monthly salary (optional)" prefix="₱" keyboardType="number-pad" value={salary} onChangeText={setSalary} placeholder="e.g. 18000" />
            <Segmented
              value={schedule}
              onChange={setSchedule}
              options={[
                { value: 'kinsenas', label: 'Kinsenas (15th/30th)' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
          </View>
        </Card>

        {error ? <Text className="px-1 text-[14px] font-semibold text-rose">{error}</Text> : null}
        <Button label="Let's go" icon="arrow-forward" onPress={submit} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
