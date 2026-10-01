import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, C, Field, GUTTER, IconButton, Tap, haptic } from '@/components/ui';
import { dateKey } from '@/lib/date';
import { parseNum, peso } from '@/lib/format';
import { useStore } from '@/lib/store';

// Common things you'll eat outside the plan, with rough Cebu prices.
const PRESETS = [
  { name: 'Puso (1 pc)', kcal: 185, protein: 4, carbs: 41, fat: 0, cost: 8 },
  { name: 'Lechon manok (¼)', kcal: 400, protein: 35, carbs: 0, fat: 28, cost: 110 },
  { name: 'Steamed siomai (4 pcs)', kcal: 200, protein: 10, carbs: 16, fat: 11, cost: 40 },
  { name: 'Ngohiong (1 pc)', kcal: 250, protein: 6, carbs: 24, fat: 15, cost: 25 },
  { name: 'Fishball (10 pcs)', kcal: 180, protein: 5, carbs: 22, fat: 8, cost: 15 },
  { name: 'Banana cue (1 stick)', kcal: 220, protein: 1, carbs: 45, fat: 5, cost: 20 },
  { name: 'Pancit canton (1 pack)', kcal: 300, protein: 6, carbs: 40, fat: 13, cost: 20 },
  { name: 'Soft drink (1 can)', kcal: 140, protein: 0, carbs: 39, fat: 0, cost: 40 },
  { name: 'Milk tea (regular)', kcal: 350, protein: 3, carbs: 55, fat: 12, cost: 90 },
];

export default function AddFood() {
  const insets = useSafeAreaInsets();
  const day = dateKey();
  const addCustomFood = useStore((s) => s.addCustomFood);
  const addExpense = useStore((s) => s.addExpense);
  const [f, setF] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '', cost: '' });
  const [logCost, setLogCost] = useState(true);
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));

  const n = (s: string) => (parseNum(s) >= 0 ? parseNum(s) : 0);
  const valid = f.name.trim().length > 0 && parseNum(f.kcal) >= 0;

  const save = () => {
    if (!valid) return haptic.warn();
    const cost = n(f.cost);
    addCustomFood(day, { name: f.name.trim(), kcal: Math.round(n(f.kcal)), protein: Math.round(n(f.protein)), carbs: Math.round(n(f.carbs)), fat: Math.round(n(f.fat)), cost });
    if (logCost && cost > 0) addExpense({ day, amount: cost, category: 'food', note: f.name.trim() });
    haptic.success();
    router.back();
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12, paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 22 }}>
        <View className="flex-row items-center justify-between">
          <IconButton icon="close" onPress={() => router.back()} />
          <Text className="text-[16px] font-bold text-ink">Add food</Text>
          <View style={{ width: 44 }} />
        </View>

        <Text className="px-1 text-[13px] font-semibold text-sub">Quick pick</Text>
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {PRESETS.map((p) => (
            <Tap
              key={p.name}
              haptics="pick"
              onPress={() => setF({ name: p.name, kcal: String(p.kcal), protein: String(p.protein), carbs: String(p.carbs), fat: String(p.fat), cost: String(p.cost) })}
              className="rounded-[18px] border px-4 py-3"
              style={{ borderColor: f.name === p.name ? C.accent : C.line, backgroundColor: f.name === p.name ? 'rgba(226,35,45,0.12)' : C.card }}>
              <Text className="text-[13px] font-semibold text-ink">{p.name}</Text>
              <Text className="text-[11px] text-dim">
                {p.kcal} kcal · {peso(p.cost)}
              </Text>
            </Tap>
          ))}
        </View>

        <Field label="Food" value={f.name} onChangeText={(name) => set({ name })} placeholder="What did you eat?" />
        <View className="flex-row" style={{ gap: 10 }}>
          <Field label="Calories" suffix="kcal" keyboardType="number-pad" value={f.kcal} onChangeText={(kcal) => set({ kcal })} placeholder="0" />
          <Field label="Cost" prefix="₱" keyboardType="decimal-pad" value={f.cost} onChangeText={(cost) => set({ cost })} placeholder="0" />
        </View>
        <View className="flex-row" style={{ gap: 10 }}>
          <Field label="Protein" suffix="g" keyboardType="number-pad" value={f.protein} onChangeText={(protein) => set({ protein })} placeholder="0" />
          <Field label="Carbs" suffix="g" keyboardType="number-pad" value={f.carbs} onChangeText={(carbs) => set({ carbs })} placeholder="0" />
          <Field label="Fat" suffix="g" keyboardType="number-pad" value={f.fat} onChangeText={(fat) => set({ fat })} placeholder="0" />
        </View>

        <View className="flex-row items-center justify-between rounded-[24px] border border-line bg-card px-5 py-4">
          <View className="flex-1">
            <Text className="text-[16px] font-bold text-ink">Add cost to Wallet</Text>
          </View>
          <Switch value={logCost} onValueChange={(v) => { haptic.pick(); setLogCost(v); }} trackColor={{ true: C.accent, false: C.raised }} thumbColor={C.ink} />
        </View>

        <Button label="Add" icon="checkmark" onPress={save} disabled={!valid} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
