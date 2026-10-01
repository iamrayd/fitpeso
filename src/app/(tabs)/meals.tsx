import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Bar, Button, C, Card, Check, Header, IconButton, Pill, Screen, SectionTitle, Stat, Tap } from '@/components/ui';
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

  if (!dm) return <Screen header={<Header eyebrow={prettyDate(today)} title="Meals" />}>{null}</Screen>;

  const opts = { targets: t, budget: foodBudget, priceFactor };
  const totals = planTotals(dm.plan, priceFactor);
  const extrasCost = dm.extras.reduce((a, f) => a + f.cost, 0);
  const kcalShort = t.kcal - totals.kcal;
  const extraRice = kcalShort >= 150 ? Math.min(2, Math.round(kcalShort / 205)) : 0;

  const replan = () => {
    // Avoid today's current picks too, so a re-plan always shows something new.
    const avoid = [...Object.values(dm.plan), ...(yesterday ? Object.values(yesterday) : [])];
    setRoll(roll + 1);
    setPlan(today, generatePlan(today, opts, avoid, roll + 1));
  };
  const changeBudget = (delta: number) => setSettings({ foodBudget: Math.max(80, foodBudget + delta) });

  return (
    <Screen>
      <Header eyebrow={prettyDate(today)} title="Meals" right={<IconButton icon="shuffle" onPress={replan} />} />

      <Card>
        <View className="flex-row items-center justify-between">
          <Text className="text-[13px] font-bold uppercase tracking-wider text-sub">Food budget</Text>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <IconButton icon="remove" size={30} onPress={() => changeBudget(-20)} />
            <Text className="w-[64px] text-center text-[17px] font-extrabold text-ink">{peso(foodBudget)}</Text>
            <IconButton icon="add" size={30} onPress={() => changeBudget(20)} />
          </View>
        </View>
        <View className="my-3">
          <Bar progress={totals.cost / foodBudget} color={C.amber} />
        </View>
        <View className="flex-row" style={{ gap: 12 }}>
          <Stat label="Plan cost" value={peso(totals.cost)} color={totals.cost > foodBudget ? C.rose : C.amber} sub={totals.cost <= foodBudget ? `${peso(foodBudget - totals.cost)} spare` : 'over budget'} />
          <Stat label="Calories" value={`${totals.kcal}`} sub={`target ${t.kcal}`} />
          <Stat label="Protein" value={`${totals.protein} g`} sub={`target ${t.protein} g`} color={totals.protein >= t.protein * 0.9 ? C.lime : C.ink} />
        </View>
        {totals.cost > foodBudget ? (
          <View className="mt-3 flex-row items-center justify-between rounded-2xl bg-rose/10 p-3" style={{ gap: 10 }}>
            <Text className="flex-1 text-[13px] text-rose">This plan is over budget. Re-plan to fit {peso(foodBudget)}.</Text>
            <Button small label="Re-plan" icon="shuffle" onPress={replan} />
          </View>
        ) : extraRice > 0 ? (
          <Text className="mt-3 text-[12px] leading-[17px] text-dim">
            Still hungry? Add {extraRice} extra cup{extraRice > 1 ? 's' : ''} of rice ({`+${extraRice * 205} kcal, +${peso(extraRice * 5 * priceFactor)}`}). Being a bit under on calories is fine; it’s what burns the belly.
          </Text>
        ) : null}
      </Card>

      <SectionTitle right={<Text className="text-[12px] font-semibold text-dim">{eaten.kcal} kcal eaten</Text>}>Today’s plan</SectionTitle>

      {SLOTS.map((slot, i) => {
        const meal = MEALS_BY_ID[dm.plan[slot.key]];
        const ate = dm.eaten.includes(slot.key);
        const mac = mealMacros(meal);
        const isOpen = open === slot.key;
        return (
          <Animated.View key={slot.key} entering={FadeInDown.delay(i * 60).duration(350)} layout={LinearTransition.duration(240)}>
            <Tap haptics="pick" onPress={() => setOpen(isOpen ? null : slot.key)} className={`rounded-3xl border p-4 ${ate ? 'border-lime/30 bg-lime/5' : 'border-line bg-card'}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Ionicons name={slot.icon} size={16} color={C.sub} />
                  <Text className="text-[12px] font-bold uppercase tracking-wider text-sub">{slot.label}</Text>
                  <Text className="text-[12px] text-dim">{slot.time}</Text>
                </View>
                <Pill label={peso(mealCost(meal, priceFactor))} color={C.amber} />
              </View>

              <View className="mt-2.5 flex-row items-center" style={{ gap: 12 }}>
                <View className="flex-1" style={{ gap: 4 }}>
                  <Text className={`text-[17px] font-bold leading-[22px] ${ate ? 'text-sub' : 'text-ink'}`}>{meal.name}</Text>
                  <Text className="text-[13px] text-sub">
                    {mac.kcal} kcal · <Text className="text-lime">P {mac.protein}</Text> · C {mac.carbs} · F {mac.fat}
                  </Text>
                </View>
                <Tap haptics={ate ? 'tap' : 'success'} onPress={() => toggleEaten(today, slot.key)} hitSlop={10}>
                  <Check on={ate} size={30} />
                </Tap>
              </View>

              {isOpen ? (
                <Animated.View entering={FadeIn.duration(220)} style={{ marginTop: 14, gap: 12 }}>
                  <View className="rounded-2xl bg-raised p-3" style={{ gap: 6 }}>
                    {meal.items.map(([k, q]) => (
                      <View key={k} className="flex-row justify-between">
                        <Text className="flex-1 text-[13px] text-sub">
                          {qtyLabel(q)} × {ING[k].name} <Text className="text-dim">({ING[k].unit})</Text>
                        </Text>
                        <Text className="text-[13px] font-semibold text-sub">{peso(ING[k].cost * q * priceFactor)}</Text>
                      </View>
                    ))}
                  </View>
                  <View className="flex-row" style={{ gap: 8 }}>
                    <Ionicons name="bulb-outline" size={16} color={C.amber} />
                    <Text className="flex-1 text-[13px] leading-[19px] text-sub">{meal.tip}</Text>
                  </View>
                  <Text className="text-[12px] font-bold uppercase tracking-wider text-dim">Swap for</Text>
                  <View style={{ gap: 6 }}>
                    {alternatives(dm.plan, slot.key, opts)
                      .filter((a) => a.meal.id !== meal.id)
                      .slice(0, 4)
                      .map((a) => (
                        <Tap key={a.meal.id} haptics="pick" onPress={() => setMeal(today, slot.key, a.meal.id)} className="flex-row items-center rounded-2xl border border-line p-3" style={{ gap: 10 }}>
                          <Ionicons name="swap-horizontal" size={16} color={C.sub} />
                          <Text className="flex-1 text-[14px] font-semibold text-ink">{a.meal.name}</Text>
                          <Text className={`text-[13px] font-bold ${a.fits ? 'text-amber' : 'text-rose'}`}>{peso(a.cost)}</Text>
                        </Tap>
                      ))}
                  </View>
                </Animated.View>
              ) : null}
            </Tap>
          </Animated.View>
        );
      })}

      <SectionTitle right={extrasCost ? <Text className="text-[12px] font-semibold text-dim">{peso(extrasCost)}</Text> : undefined}>Other food today</SectionTitle>
      {dm.extras.map((f) => (
        <Animated.View key={f.id} entering={FadeIn} layout={LinearTransition}>
          <Card className="flex-row items-center" style={{ gap: 12 }}>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-ink">{f.name}</Text>
              <Text className="text-[13px] text-sub">
                {f.kcal} kcal · P {f.protein} · C {f.carbs} · F {f.fat}
                {f.cost ? ` · ${peso(f.cost)}` : ''}
              </Text>
            </View>
            <IconButton icon="trash-outline" size={34} color={C.rose} onPress={() => removeCustomFood(today, f.id)} />
          </Card>
        </Animated.View>
      ))}
      <Button label="Add food you ate" icon="add" variant="ghost" onPress={() => router.push('/add-food')} />
    </Screen>
  );
}
