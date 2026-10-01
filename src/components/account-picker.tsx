import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, Text, View } from 'react-native';

import { peso } from '@/lib/format';
import { balanceOf, useStore } from '@/lib/store';
import { C, Tap } from './ui';

/** Horizontal row of wallets with their balances; one is selected. */
export function AccountPicker({ value, onChange }: { value: string | undefined; onChange: (id: string) => void }) {
  const accounts = useStore((s) => s.accounts);
  const incomes = useStore((s) => s.incomes);
  const expenses = useStore((s) => s.expenses);
  return (
    <View style={{ gap: 8 }}>
      <Text className="px-1 text-[13px] font-semibold text-sub">Wallet</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} keyboardShouldPersistTaps="handled">
        {accounts.map((a) => {
          const on = a.id === value;
          return (
            <Tap
              key={a.id}
              onPress={() => onChange(a.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              className="flex-row items-center rounded-[18px] border px-4 py-3"
              style={{ gap: 10, borderColor: on ? C.accent : C.line, backgroundColor: on ? 'rgba(226,35,45,0.12)' : C.card }}>
              <Ionicons name={a.icon} size={18} color={on ? C.accent : C.sub} />
              <View>
                <Text className="text-[14px] font-bold" style={{ color: on ? C.ink : C.sub }}>
                  {a.name}
                </Text>
                <Text className="text-[12px] text-dim">{peso(balanceOf(a, incomes, expenses))}</Text>
              </View>
            </Tap>
          );
        })}
      </ScrollView>
    </View>
  );
}
