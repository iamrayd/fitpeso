import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Bar, Button, C, Card, Check, Header, IconButton, Label, Screen, SectionTitle, Stat, Tap } from '@/components/ui';
import { ING, MEALS_BY_ID, SLOTS, mealCost, mealMacros, qtyLabel, type Slot } from '@/data/foods';
import { addDays, prettyDate } from '@/lib/date';
import { peso } from '@/lib/format';
import { useDayMeals, useEatenMacros, useTargets, useToday } from '@/lib/hooks';
import { alternatives, generatePlan, planTotals } from '@/lib/planner';
import { useStore } from '@/lib/store';

export default function Meals() {
  const today = useToday();
  const t = useTargets()!;
  const dm = useDayMeals(today);
  const eaten = useEatenMacros(today);
  const foodBudget = useStore((s) => s.foodBudget);
  const priceFactor = useStore((s) => s.priceFactor);
  const yesterday = useStore((s) => s.meals[addDays(today, -1)]?.plan);
  const { setPlan, setMeal, toggleEaten, removeCustomFood, setSettings } = useStore.getState();
  const [open, setOpen] = useState<Slot | null>(null);
  const [roll, setRoll] = useState(0);

  if (!dm)
    return (
      <Screen>
        <Header eyebrow={prettyDate(today)} title="Meals" />
      </Screen>
    );

  const opts = { targets: t, budget: foodBudget, priceFactor };
  const totals = planTotals(dm.plan, priceFactor);
  const kcalShort = t.kcal - totals.kcal;
  const extraRice = kcalShort >= 150 ? Math.min(2, Math.round(kcalShort / 205)) : 0;
  const over = totals.cost > foodBudget;

  const replan = () => {
    // Avoid today's current picks too, so a re-plan always shows something new.
    const avoid = [...Object.values(dm.plan), ...(yesterday ? Object.values(yesterday) : [])];
    setRoll(roll + 1);
    setPlan(today, generatePlan(today, opts, avoid, roll + 1));
  };
  const changeBudget = (delta: number) => setSettings({ foodBudget: Math.max(80, foodBudget + delta) });

  return (
    <Screen>
      <Header eyebrow={prettyDate(today)} title="Meals" right={<IconButton icon="shuffle" label="Re-plan today’s meals" onPress={replan} />} />

      <Card>
        <View style={{ gap: 18 }}>
          <Label
            right={
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <IconButton icon="remove" label="Lower food budget by 20 pesos" size={34} onPress={() => changeBudget(-20)} />
                <Text className="min-w-[70px] text-center text-[18px] font-extrabold text-ink" maxFontSizeMultiplier={1.3} accessibilityLabel={`Food budget ${peso(foodBudget)} a day`}>
                  {peso(foodBudget)}
                </Text>
                <IconButton icon="add" label="Raise food budget by 20 pesos" size={34} onPress={() => changeBudget(20)} />
              </View>
            }>
            Food budget
          </Label>
          <Bar progress={totals.cost / foodBudget} label={`Plan costs ${peso(totals.cost)} of ${peso(foodBudget)}`} />
          <View className="flex-row" style={{ gap: 12 }}>
            <Stat label="Plan" value={peso(totals.cost)} color={over ? C.warn : C.ink} />
            <Stat label="Calories" value={`${totals.kcal}`} sub={`of ${t.kcal}`} />
            <Stat label="Protein" value={`${totals.protein}g`} sub={`of ${t.protein}g`} color={totals.protein >= t.protein * 0.9 ? C.accent : C.ink} />
          </View>
          {over ? (
            <Button small label={`Over budget · re-plan`} icon="shuffle" onPress={replan} />
          ) : extraRice > 0 ? (
            <Text className="text-[13px] text-dim">
              Still hungry? +{extraRice} cup{extraRice > 1 ? 's' : ''} rice (+{peso(extraRice * 5 * priceFactor)})
            </Text>
          ) : null}
        </View>
      </Card>

      <SectionTitle right={<Text className="text-[13px] font-semibold text-dim">{eaten.kcal} kcal eaten</Text>}>Today</SectionTitle>

      {SLOTS.map((slot, i) => {
        const meal = MEALS_BY_ID[dm.plan[slot.key]];
        const ate = dm.eaten.includes(slot.key);
        const mac = mealMacros(meal);
        const isOpen = open === slot.key;
        return (
          <Animated.View key={slot.key} entering={FadeInDown.delay(i * 60).duration(350)} layout={LinearTransition.duration(240)}>
            <Tap
              onPress={() => setOpen(isOpen ? null : slot.key)}
              accessibilityLabel={`${slot.label}: ${meal.name}, ${peso(mealCost(meal, priceFactor))}, ${mac.kcal} calories, ${mac.protein} grams protein`}
              accessibilityHint={isOpen ? 'Hides details' : 'Shows ingredients and swaps'}
              accessibilityState={{ expanded: isOpen }}
              className="rounded-[28px] border p-5"
              style={{ borderColor: ate ? 'rgba(226,35,45,0.35)' : C.line, backgroundColor: ate ? 'rgba(226,35,45,0.06)' : C.card }}>
              <View className="flex-row items-center" style={{ gap: 16 }}>
                <View className="flex-1" style={{ gap: 6 }}>
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Ionicons name={slot.icon} size={15} color={C.accent} />
                    <Text className="text-[13px] font-bold text-sub">{slot.label}</Text>
                    <Text className="text-[13px] font-bold text-ink">· {peso(mealCost(meal, priceFactor))}</Text>
                  </View>
                  <Text className={`text-[18px] font-bold leading-[24px] ${ate ? 'text-dim' : 'text-ink'}`}>{meal.name}</Text>
                  <Text className="text-[13px] text-sub">
                    {mac.kcal} kcal · {mac.protein}g protein
                  </Text>
                </View>
                <Tap onPress={() => toggleEaten(today, slot.key)} hitSlop={12} accessibilityRole="checkbox" accessibilityState={{ checked: ate }} accessibilityLabel={`Mark ${slot.label.toLowerCase()} eaten`}>
                  <Check on={ate} size={32} />
                </Tap>
              </View>

              {isOpen ? (
                <Animated.View entering={FadeIn.duration(220)} style={{ marginTop: 18, gap: 16 }}>
                  <View className="rounded-[20px] bg-raised p-4" style={{ gap: 8 }}>
                    {meal.items.map(([k, q]) => (
                      <View key={k} className="flex-row justify-between" style={{ gap: 12 }}>
                        <Text className="flex-1 text-[14px] text-sub">
                          {qtyLabel(q)} × {ING[k].name}
                        </Text>
                        <Text className="text-[14px] font-semibold text-sub">{peso(ING[k].cost * q * priceFactor)}</Text>
                      </View>
                    ))}
                  </View>
                  <Text className="text-[14px] leading-[21px] text-sub">{meal.tip}</Text>
                  <View style={{ gap: 8 }}>
                    <Label>Swap for</Label>
                    {alternatives(dm.plan, slot.key, opts)
                      .filter((a) => a.meal.id !== meal.id)
                      .slice(0, 4)
                      .map((a) => (
                        <Tap key={a.meal.id} onPress={() => setMeal(today, slot.key, a.meal.id)} accessibilityLabel={`Swap to ${a.meal.name}, ${peso(a.cost)}${a.fits ? '' : ', over budget'}`} className="flex-row items-center rounded-[18px] border border-line px-4 py-3.5" style={{ gap: 12 }}>
                          <Text className="flex-1 text-[15px] font-semibold text-ink">{a.meal.name}</Text>
                          <Text className="text-[14px] font-bold" style={{ color: a.fits ? C.sub : C.warn }}>
                            {peso(a.cost)}
                          </Text>
                        </Tap>
                      ))}
                  </View>
                </Animated.View>
              ) : null}
            </Tap>
          </Animated.View>
        );
      })}

      {dm.extras.length ? <SectionTitle>Extras</SectionTitle> : null}
      {dm.extras.map((f) => (
        <Animated.View key={f.id} entering={FadeIn} layout={LinearTransition}>
          <Card className="flex-row items-center" style={{ gap: 14 }}>
            <View className="flex-1" style={{ gap: 2 }}>
              <Text className="text-[16px] font-bold text-ink">{f.name}</Text>
              <Text className="text-[13px] text-sub">
                {f.kcal} kcal · {f.protein}g protein{f.cost ? ` · ${peso(f.cost)}` : ''}
              </Text>
            </View>
            <IconButton icon="trash-outline" label={`Remove ${f.name}`} size={38} color={C.glow} onPress={() => removeCustomFood(today, f.id)} />
          </Card>
        </Animated.View>
      ))}
      <Button label="Add other food" icon="add" variant="ghost" onPress={() => router.push('/add-food')} />
    </Screen>
  );
}
