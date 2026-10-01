import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountPicker } from '@/components/account-picker';
import { AmountInput } from '@/components/amount-input';
import { Button, C, Field, GUTTER, IconButton } from '@/components/ui';
import { dateKey } from '@/lib/date';
import { parseNum, peso } from '@/lib/format';
import { closeTo } from '@/lib/nav';
import { balanceOf, defaultAccountId, useStore } from '@/lib/store';

/** Move money between your own wallets (e.g. cash-in to GCash). Edits one when opened with an `id`. */
export default function TransferScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  // Read once so later store updates never overwrite what you're typing.
  const [existing] = useState(() => useStore.getState().transfers.find((t) => t.id === id));
  const accounts = useStore((s) => s.accounts);
  const incomes = useStore((s) => s.incomes);
  const expenses = useStore((s) => s.expenses);
  const transfers = useStore((s) => s.transfers);
  const { addTransfer, updateTransfer, removeTransfer } = useStore.getState();

  const [fromId, setFromId] = useState(() => existing?.fromId ?? defaultAccountId(useStore.getState()));
  const [toId, setToId] = useState(() => existing?.toId ?? useStore.getState().accounts.find((a) => a.id !== fromId)?.id);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const pickFrom = (next: string) => {
    setFromId(next);
    // Never leave From and To the same: move To to another wallet.
    if (next === toId) setToId(accounts.find((a) => a.id !== next)?.id);
  };

  const from = accounts.find((a) => a.id === fromId);
  const to = accounts.find((a) => a.id === toId);
  const value = parseNum(amount);
  const valid = value > 0 && value < 100_000_000 && !!from && !!to && from.id !== to.id;
  // When editing, this transfer is already subtracted from the source, so add it back for the check.
  const available = from ? balanceOf(from, { incomes, expenses, transfers }) + (existing && existing.fromId === from.id ? existing.amount : 0) : 0;

  const save = () => {
    if (!valid || !from || !to) return;
    const fields = { amount: Math.round(value * 100) / 100, fromId: from.id, toId: to.id, note: note.trim() };
    if (existing) updateTransfer(existing.id, fields);
    else addTransfer({ ...fields, day: dateKey() });
    closeTo('/wallet');
  };

  const remove = () => {
    if (!existing) return;
    if (!confirmDelete) return setConfirmDelete(true);
    removeTransfer(existing.id);
    closeTo('/wallet');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12, paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 24 }}>
        <View className="flex-row items-center justify-between">
          <IconButton icon="close" label="Close" onPress={() => closeTo('/wallet')} />
          <Text className="text-[16px] font-bold text-ink" accessibilityRole="header">
            {existing ? 'Edit transfer' : 'Transfer'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {accounts.length < 2 ? (
          <Text className="text-center text-[15px] leading-[22px] text-sub">You need at least two wallets to move money between them. Add one from the Wallet tab.</Text>
        ) : (
          <>
            <AmountInput value={amount} onChange={setAmount} onSubmit={save} color={C.ink} quick={[100, 200, 500, 1000]} autoFocus={!existing} />

            <AccountPicker label="From" value={fromId} onChange={pickFrom} />
            <View className="items-center" importantForAccessibility="no-hide-descendants">
              <Ionicons name="arrow-down" size={22} color={C.accent} />
            </View>
            <AccountPicker label="To" value={toId} onChange={setToId} disabledId={fromId} />

            {valid && from && value > available ? (
              <Text className="text-center text-[13px] text-warn" accessibilityLiveRegion="polite">
                {from.name} only has {peso(available)}. This will make it negative.
              </Text>
            ) : null}

            <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional, e.g. cash-in at 7-Eleven" returnKeyType="done" onSubmitEditing={save} />

            <Button
              label={valid && from && to ? `Move ${peso(value, value % 1 !== 0)} to ${to.name}` : existing ? 'Save' : 'Move'}
              icon="swap-horizontal"
              onPress={save}
              disabled={!valid}
            />
            {existing ? <Button variant="danger" icon="trash-outline" label={confirmDelete ? 'Tap again to delete' : 'Delete transfer'} onPress={remove} /> : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
