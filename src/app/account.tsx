import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, C, Field, GUTTER, IconButton, Tap } from '@/components/ui';
import { parseNum } from '@/lib/format';
import { closeTo } from '@/lib/nav';
import { ACCOUNT_ICONS, balanceOf, useStore, type AccountIcon } from '@/lib/store';

/** Add a wallet (no `id` param) or edit one: rename, change icon, set its balance, delete. */
export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const account = useStore((s) => s.accounts.find((a) => a.id === id));
  const canDelete = useStore((s) => s.accounts.length > 1);
  const { addAccount, updateAccount, removeAccount } = useStore.getState();
  const editing = !!account;

  const [name, setName] = useState(account?.name ?? '');
  const [icon, setIcon] = useState<AccountIcon>(account?.icon ?? 'wallet-outline');
  const [balance, setBalance] = useState(() => {
    if (!account) return '';
    const { incomes, expenses } = useStore.getState();
    return String(balanceOf(account, incomes, expenses));
  });
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const save = () => {
    const n = balance.trim() ? parseNum(balance) : 0;
    if (!name.trim()) return setError('Give your wallet a name.');
    if (!Number.isFinite(n) || Math.abs(n) >= 100_000_000) return setError('Enter a valid balance.');
    if (editing) updateAccount(account.id, { name: name.trim(), icon, balance: n });
    else addAccount({ name: name.trim(), icon, balance: n });
    closeTo('/wallet');
  };

  const remove = () => {
    if (!editing) return;
    if (!confirmDelete) return setConfirmDelete(true);
    removeAccount(account.id);
    closeTo('/wallet');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12, paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 32, gap: 24 }}>
        <View className="flex-row items-center justify-between">
          <IconButton icon="close" label="Close" onPress={() => closeTo('/wallet')} />
          <Text className="text-[16px] font-bold text-ink">{editing ? 'Edit wallet' : 'New wallet'}</Text>
          <View style={{ width: 44 }} />
        </View>

        <View className="items-center py-2">
          <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-accent">
            <Ionicons name={icon} size={36} color={C.ink} />
          </View>
        </View>

        <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Maya, Savings" autoCapitalize="words" autoFocus={!editing} />

        <View style={{ gap: 8 }}>
          <Text className="px-1 text-[13px] font-semibold text-sub">Icon</Text>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {ACCOUNT_ICONS.map((ic) => {
              const on = ic === icon;
              return (
                <Tap
                  key={ic}
                  onPress={() => setIcon(ic)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  className="h-14 w-14 items-center justify-center rounded-2xl border-2"
                  style={{ borderColor: on ? C.accent : C.line, backgroundColor: on ? 'rgba(226,35,45,0.12)' : C.card }}>
                  <Ionicons name={ic} size={22} color={on ? C.accent : C.sub} />
                </Tap>
              );
            })}
          </View>
        </View>

        <Field label={editing ? 'Current balance' : 'Starting balance'} prefix="₱" keyboardType="decimal-pad" value={balance} onChangeText={setBalance} placeholder="0" returnKeyType="done" onSubmitEditing={save} />

        {error ? <Text className="text-center text-[14px] font-semibold text-glow">{error}</Text> : null}
        <Button label={editing ? 'Save' : 'Add wallet'} icon="checkmark" onPress={save} />
        {editing && canDelete ? <Button variant="danger" icon="trash-outline" label={confirmDelete ? 'Tap again to delete' : 'Delete wallet'} onPress={remove} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
