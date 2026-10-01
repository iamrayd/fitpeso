import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountPicker } from '@/components/account-picker';
import { AmountInput } from '@/components/amount-input';
import { Button, C, Field, GUTTER, IconButton, Tap } from '@/components/ui';
import { dateKey, fromKey, relativeDay } from '@/lib/date';
import { parseNum, peso } from '@/lib/format';
import { closeTo } from '@/lib/nav';
import { CATEGORIES, defaultAccountId, useStore, type Category } from '@/lib/store';

export default function AddExpense() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ day?: string }>();
  const today = dateKey();
  const day = params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : today;
  const addExpense = useStore((s) => s.addExpense);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState(() => defaultAccountId(useStore.getState()));

  const value = parseNum(amount);
  const valid = value > 0 && value < 10_000_000;

  const save = () => {
    if (!valid) return;
    // For a past day, stamp the expense at noon of that day so it sorts sensibly.
    const ts = day === today ? Date.now() : fromKey(day).getTime() + 12 * 3600_000;
    addExpense({ day, ts, amount: Math.round(value * 100) / 100, category, note: note.trim(), accountId });
    closeTo('/wallet');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12, paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 24 }}>
        <View className="flex-row items-center justify-between">
          <IconButton icon="close" onPress={() => closeTo('/wallet')} />
          <Text className="text-[16px] font-bold text-ink">Expense · {relativeDay(day, today)}</Text>
          <View style={{ width: 44 }} />
        </View>

        <AmountInput value={amount} onChange={setAmount} onSubmit={save} />

        <AccountPicker value={accountId} onChange={setAccountId} />

        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {(Object.keys(CATEGORIES) as Category[]).map((k) => {
            const m = CATEGORIES[k];
            const on = k === category;
            return (
              <Tap
                key={k}
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
