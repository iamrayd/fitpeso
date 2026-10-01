import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, C, Field, GUTTER, IconButton, Tap, haptic } from '@/components/ui';
import { dateKey, fromKey, relativeDay } from '@/lib/date';
import { parseNum, peso } from '@/lib/format';
import { CATEGORIES, useStore, type Category } from '@/lib/store';

const QUICK = [20, 50, 100, 200, 500];

export default function AddExpense() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ day?: string }>();
  const today = dateKey();
  const day = params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : today;
  const addExpense = useStore((s) => s.addExpense);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [note, setNote] = useState('');

  const value = parseNum(amount);
  const valid = value > 0 && value < 10_000_000;

  const save = () => {
    if (!valid) return haptic.warn();
    // For a past day, stamp the expense at noon of that day so it sorts sensibly.
    const ts = day === today ? Date.now() : fromKey(day).getTime() + 12 * 3600_000;
    addExpense({ day, ts, amount: Math.round(value * 100) / 100, category, note: note.trim() });
    haptic.success();
    router.back();
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12, paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 24 }}>
        <View className="flex-row items-center justify-between">
          <IconButton icon="close" onPress={() => router.back()} />
          <Text className="text-[16px] font-bold text-ink">{relativeDay(day, today)}</Text>
          <View style={{ width: 44 }} />
        </View>

        <View className="items-center py-4">
          <View className="w-full flex-row items-center justify-center">
            <Text className="text-[40px] font-extrabold text-accent">₱</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
              placeholder="0"
              placeholderTextColor={C.dim}
              keyboardType="decimal-pad"
              autoFocus
              selectionColor={C.accent}
              cursorColor={C.accent}
              className="text-[56px] font-extrabold text-ink"
              // Grow with the digits so the number always hugs the ₱ sign.
              style={{ padding: 0, marginLeft: 4, width: Math.min(280, Math.max(1, amount.length) * 36 + 8) }}
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>
        </View>

        <View className="flex-row justify-center" style={{ gap: 8 }}>
          {QUICK.map((q) => (
            <Tap key={q} haptics="pick" onPress={() => setAmount(String((parseNum(amount) || 0) + q))} className="rounded-full bg-raised px-3.5 py-2.5">
              <Text className="text-[13px] font-bold text-ink">+{peso(q)}</Text>
            </Tap>
          ))}
        </View>

        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {(Object.keys(CATEGORIES) as Category[]).map((k) => {
            const m = CATEGORIES[k];
            const on = k === category;
            return (
              <Tap
                key={k}
                haptics="pick"
                onPress={() => setCategory(k)}
                className="flex-row items-center rounded-[18px] border px-4 py-3"
                style={{ gap: 8, borderColor: on ? C.accent : C.line, backgroundColor: on ? 'rgba(226,35,45,0.12)' : C.card }}>
                <Ionicons name={m.icon} size={17} color={on ? C.accent : C.sub} />
                <Text style={{ color: on ? C.ink : C.sub }} className="text-[14px] font-semibold">
                  {m.label}
                </Text>
              </Tap>
            );
          })}
        </View>

        <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" returnKeyType="done" onSubmitEditing={save} />

        <Button label={valid ? `Save ${peso(value, value % 1 !== 0)}` : 'Save'} icon="checkmark" onPress={save} disabled={!valid} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
