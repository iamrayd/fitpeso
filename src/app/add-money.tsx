import { useState } from 'react';
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

/** Money coming in: salary, allowance, cash-in… Adds to a wallet's balance. */
export default function AddMoney() {
  const insets = useSafeAreaInsets();
  const addIncome = useStore((s) => s.addIncome);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('Salary');
  const [accountId, setAccountId] = useState(() => defaultAccountId(useStore.getState()));

  const value = parseNum(amount);
  const valid = value > 0 && value < 100_000_000 && !!accountId;

  const save = () => {
    if (!valid || !accountId) return;
    addIncome({ day: dateKey(), amount: Math.round(value * 100) / 100, accountId, note: note.trim() });
    closeTo('/wallet');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12, paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 24 }}>
        <View className="flex-row items-center justify-between">
          <IconButton icon="close" onPress={() => closeTo('/wallet')} />
          <Text className="text-[16px] font-bold text-ink">Add money</Text>
          <View style={{ width: 44 }} />
        </View>

        <AmountInput value={amount} onChange={setAmount} onSubmit={save} color={C.ink} quick={[100, 500, 1000, 5000]} />

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

        <Button label={valid ? `Add ${peso(value, value % 1 !== 0)}` : 'Add'} icon="arrow-down" onPress={save} disabled={!valid} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
