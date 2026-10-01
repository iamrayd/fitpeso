import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, Text, View } from 'react-native';

import { peso } from '@/lib/format';
import { balanceOf, useStore } from '@/lib/store';
import { C, Tap } from './ui';

/** Horizontal row of wallets with their balances; one is selected. */
export function AccountPicker({ value, onChange, label = 'Wallet', disabledId }: { value: string | undefined; onChange: (id: string) => void; label?: string; disabledId?: string }) {
  const accounts = useStore((s) => s.accounts);
  const incomes = useStore((s) => s.incomes);
  const expenses = useStore((s) => s.expenses);
  const transfers = useStore((s) => s.transfers);
  return (
    <View style={{ gap: 8 }}>
      <Text className="px-1 text-[13px] font-semibold text-sub">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} keyboardShouldPersistTaps="handled">
        {accounts.map((a) => {
          const on = a.id === value;
          const off = a.id === disabledId;
          return (
            <Tap
              key={a.id}
              onPress={() => onChange(a.id)}
              disabled={off}
              accessibilityLabel={`${label}: ${a.name}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              className="flex-row items-center rounded-[18px] border px-4 py-3"
              style={{ gap: 10, borderColor: on ? C.accent : C.line, backgroundColor: on ? 'rgba(226,35,45,0.12)' : C.card }}>
              <Ionicons name={a.icon} size={18} color={on ? C.accent : C.sub} />
              <View>
                <Text className="text-[14px] font-bold" style={{ color: on ? C.ink : C.sub }}>
                  {a.name}
                </Text>
                <Text className="text-[12px] text-dim">{peso(balanceOf(a, { incomes, expenses, transfers }))}</Text>
              </View>
            </Tap>
          );
        })}
      </ScrollView>
    </View>
  );
}
