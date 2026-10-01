import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountPicker } from '@/components/account-picker';
import { AmountInput } from '@/components/amount-input';
import { Button, C, Field, GUTTER, IconButton, Tap } from '@/components/ui';
import { dateKey, fromKey, relativeDay } from '@/lib/date';
import { parseNum, peso } from '@/lib/format';
import { closeTo } from '@/lib/nav';
import { CATEGORIES, defaultAccountId, useStore, type Category } from '@/lib/store';

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** New expense, or edit one when opened with an `id`. */
export default function AddExpense() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ day?: string; id?: string }>();
  const today = dateKey();
  // Read the entry once so later store updates never overwrite what you're typing.
  const [existing] = useState(() => useStore.getState().expenses.find((e) => e.id === params.id));
  const day = existing?.day ?? (params.day && DAY_KEY.test(params.day) ? params.day : today);
  const { addExpense, updateExpense, removeExpense } = useStore.getState();
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [category, setCategory] = useState<Category>(existing?.category ?? 'food');
  const [note, setNote] = useState(existing?.note ?? '');
  const [accountId, setAccountId] = useState(() => existing?.accountId ?? defaultAccountId(useStore.getState()));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const value = parseNum(amount);
  const valid = value > 0 && value < 10_000_000;

  const save = () => {
    if (!valid) return;
    const fields = { amount: Math.round(value * 100) / 100, category, note: note.trim(), accountId };
    if (existing) updateExpense(existing.id, fields);
    // For a past day, stamp the expense at noon of that day so it sorts sensibly.
    else addExpense({ ...fields, day, ts: day === today ? Date.now() : fromKey(day).getTime() + 12 * 3600_000 });
    closeTo('/wallet');
  };

  const remove = () => {
    if (!existing) return;
    if (!confirmDelete) return setConfirmDelete(true);
    removeExpense(existing.id);
    closeTo('/wallet');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12, paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 24 }}>
        <View className="flex-row items-center justify-between">
          <IconButton icon="close" label="Close" onPress={() => closeTo('/wallet')} />
          <Text className="text-[16px] font-bold text-ink" accessibilityRole="header">
            {existing ? 'Edit expense' : 'Expense'} · {relativeDay(day, today)}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <AmountInput value={amount} onChange={setAmount} onSubmit={save} autoFocus={!existing} />

        <AccountPicker value={accountId} onChange={setAccountId} />

        <View style={{ gap: 8 }}>
          <Text className="px-1 text-[13px] font-semibold text-sub">Category</Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {(Object.keys(CATEGORIES) as Category[]).map((k) => {
              const m = CATEGORIES[k];
              const on = k === category;
              return (
                <Tap
                  key={k}
                  onPress={() => setCategory(k)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={m.label}
                  className="flex-row items-center rounded-[18px] border px-4 py-3"
                  style={{ gap: 8, borderColor: on ? C.accent : C.line, backgroundColor: on ? 'rgba(226,35,45,0.12)' : C.card }}>
                  <Ionicons name={m.icon} size={17} color={on ? C.glow : C.sub} />
                  <Text style={{ color: on ? C.ink : C.sub }} className="text-[14px] font-semibold">
                    {m.label}
                  </Text>
                </Tap>
              );
            })}
          </View>
        </View>

        <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" returnKeyType="done" onSubmitEditing={save} />

        <Button label={valid ? `Save ${peso(value, value % 1 !== 0)}` : 'Save'} icon="checkmark" onPress={save} disabled={!valid} />
        {existing ? <Button variant="danger" icon="trash-outline" label={confirmDelete ? 'Tap again to delete' : 'Delete expense'} onPress={remove} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
