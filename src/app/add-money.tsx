import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountPicker } from '@/components/account-picker';
import { AmountInput } from '@/components/amount-input';
import { Button, C, Field, GUTTER, IconButton, Tap } from '@/components/ui';
import { dateKey } from '@/lib/date';
import { parseNum, peso } from '@/lib/format';
import { closeTo } from '@/lib/nav';
import { defaultAccountId, useStore } from '@/lib/store';

const SOURCES = ['Salary', 'Allowance', 'Side hustle', 'Gift', 'Refund'];

/** Money coming in (salary, allowance, cash-in…), or edit an entry when opened with an `id`. */
export default function AddMoney() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  // Read the entry once so later store updates never overwrite what you're typing.
  const [existing] = useState(() => useStore.getState().incomes.find((i) => i.id === id));
  const { addIncome, updateIncome, removeIncome } = useStore.getState();
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [note, setNote] = useState(existing?.note ?? 'Salary');
  const [accountId, setAccountId] = useState(() => existing?.accountId ?? defaultAccountId(useStore.getState()));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const value = parseNum(amount);
  const valid = value > 0 && value < 100_000_000 && !!accountId;

  const save = () => {
    if (!valid || !accountId) return;
    const fields = { amount: Math.round(value * 100) / 100, accountId, note: note.trim() };
    if (existing) updateIncome(existing.id, fields);
    else addIncome({ ...fields, day: dateKey() });
    closeTo('/wallet');
  };

  const remove = () => {
    if (!existing) return;
    if (!confirmDelete) return setConfirmDelete(true);
    removeIncome(existing.id);
    closeTo('/wallet');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12, paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 24 }}>
        <View className="flex-row items-center justify-between">
          <IconButton icon="close" label="Close" onPress={() => closeTo('/wallet')} />
          <Text className="text-[16px] font-bold text-ink" accessibilityRole="header">
            {existing ? 'Edit money in' : 'Add money'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <AmountInput value={amount} onChange={setAmount} onSubmit={save} color={C.ink} quick={[100, 500, 1000, 5000]} autoFocus={!existing} />

        <AccountPicker value={accountId} onChange={setAccountId} />

        <View style={{ gap: 8 }}>
          <Text className="px-1 text-[13px] font-semibold text-sub">From</Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {SOURCES.map((src) => {
              const on = note === src;
              return (
                <Tap
                  key={src}
                  onPress={() => setNote(src)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  className="rounded-[18px] border px-4 py-3"
                  style={{ borderColor: on ? C.accent : C.line, backgroundColor: on ? 'rgba(226,35,45,0.12)' : C.card }}>
                  <Text style={{ color: on ? C.ink : C.sub }} className="text-[14px] font-semibold">
                    {src}
                  </Text>
                </Tap>
              );
            })}
          </View>
        </View>

        <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" returnKeyType="done" onSubmitEditing={save} />

        <Button label={valid ? `${existing ? 'Save' : 'Add'} ${peso(value, value % 1 !== 0)}` : existing ? 'Save' : 'Add'} icon={existing ? 'checkmark' : 'arrow-down'} onPress={save} disabled={!valid} />
        {existing ? <Button variant="danger" icon="trash-outline" label={confirmDelete ? 'Tap again to delete' : 'Delete entry'} onPress={remove} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
