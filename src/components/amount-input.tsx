import { Text, TextInput, View } from 'react-native';

import { parseNum, peso } from '@/lib/format';
import { C, Tap } from './ui';

const QUICK = [20, 50, 100, 200, 500];

/** Big centered peso amount with quick-add chips. Keeps only digits and one decimal point. */
export function AmountInput({ value, onChange, onSubmit, color = C.accent, quick = QUICK, autoFocus = true }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; color?: string; quick?: number[]; autoFocus?: boolean }) {
  return (
    <View style={{ gap: 20 }}>
      <View className="w-full flex-row items-center justify-center py-4">
        <Text className="text-[40px] font-extrabold" style={{ color }} maxFontSizeMultiplier={1.2} importantForAccessibility="no">
          ₱
        </Text>
        <TextInput
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
          placeholder="0"
          placeholderTextColor={C.dim}
          keyboardType="decimal-pad"
          autoFocus={autoFocus}
          accessibilityLabel="Amount in pesos"
          maxFontSizeMultiplier={1.2}
          selectionColor={C.accent}
          cursorColor={C.accent}
          className="text-[56px] font-extrabold text-ink"
          // Grow with the digits so the number always hugs the ₱ sign.
          style={{ padding: 0, marginLeft: 4, width: Math.min(280, Math.max(1, value.length) * 36 + 8) }}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
      </View>
      <View className="flex-row flex-wrap justify-center" style={{ gap: 8 }}>
        {quick.map((q) => (
          <Tap key={q} onPress={() => onChange(String((parseNum(value) || 0) + q))} accessibilityLabel={`Add ${q} pesos`} className="rounded-full bg-raised px-3.5 py-2.5">
            <Text className="text-[13px] font-bold text-ink">+{peso(q)}</Text>
          </Tap>
        ))}
      </View>
    </View>
  );
}
