import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Bar, C, Card, Check, Header, Label, MacroBar, Ring, Screen, Stat, Tap } from '@/components/ui';
import { MEALS_BY_ID, SLOTS, mealCost, mealMacros } from '@/data/foods';
import { POSTURE, PUSHUP_GOAL, WEEK } from '@/data/workouts';
import { prettyDate, weekdayIndex } from '@/lib/date';
import { bmi, bmiCategory, whtr, whtrCategory } from '@/lib/fitness';
import { peso } from '@/lib/format';
import { useDayMeals, useEatenMacros, useTargets, useToday } from '@/lib/hooks';
import { budgetFor, useStore } from '@/lib/store';
import { totalOf } from '@/lib/wallet';

const enter = (i: number) => FadeInDown.delay(i * 60).duration(380);

export default function Today() {
  const today = useToday();
  const profile = useStore((s) => s.profile)!;
  const t = useTargets()!;
  const eaten = useEatenMacros(today);
  const dayMeals = useDayMeals(today);
  const priceFactor = useStore((s) => s.priceFactor);
  const toggleEaten = useStore((s) => s.toggleEaten);
  const workout = useStore((s) => s.workouts[today]);
  const addPushups = useStore((s) => s.addPushups);
  const expenses = useStore((s) => s.expenses);
  const budget = useStore((s) => budgetFor(s, today));

  const plan = WEEK[weekdayIndex(today)];
  const allIds = [...plan.exercises, ...POSTURE].map((e) => e.id);
  const doneCount = allIds.filter((id) => workout?.done.includes(id)).length;
  const pushups = workout?.pushups ?? 0;
  const spent = totalOf(expenses.filter((e) => e.day === today));
  const left = budget - spent;
  const kcalLeft = t.kcal - eaten.kcal;

  const nextSlot = dayMeals ? SLOTS.find((s) => !dayMeals.eaten.includes(s.key)) : undefined;
  const nextMeal = nextSlot && dayMeals ? MEALS_BY_ID[dayMeals.plan[nextSlot.key]] : undefined;

  const b = bmi(profile);
  const w = whtr(profile);

  return (
    <Screen>
      <Header eyebrow={prettyDate(today)} title={`Hi, ${profile.name.split(' ')[0]}`} />

      <Animated.View entering={enter(0)}>
        <Card>
          <View className="flex-row items-center" style={{ gap: 22 }}>
            <Ring size={136} stroke={14} progress={eaten.kcal / t.kcal} color={eaten.kcal > t.kcal ? C.warn : C.accent}>
              <Text className="text-[30px] font-extrabold text-ink">{Math.abs(kcalLeft)}</Text>
              <Text className="text-[12px] font-semibold text-sub">{kcalLeft >= 0 ? 'kcal left' : 'kcal over'}</Text>
            </Ring>
            <View className="flex-1" style={{ gap: 16 }}>
              <MacroBar label="Protein" value={eaten.protein} target={t.protein} color={C.accent} />
              <MacroBar label="Carbs" value={eaten.carbs} target={t.carbs} color={C.ink} />
              <MacroBar label="Fat" value={eaten.fat} target={t.fat} color={C.dim} />
            </View>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={enter(1)} style={{ flexDirection: 'row', gap: 16 }}>
        <Card className="flex-1">
          <View style={{ gap: 14 }}>
            <Label right={pushups >= PUSHUP_GOAL ? <Ionicons name="trophy" size={16} color={C.warn} /> : undefined}>Push-ups</Label>
            <Text className="text-[34px] font-extrabold text-ink">
              {pushups}
              <Text className="text-[16px] text-dim"> /{PUSHUP_GOAL}</Text>
            </Text>
            <Bar progress={pushups / PUSHUP_GOAL} overColor={C.accent} />
            <View className="flex-row" style={{ gap: 8 }}>
              {[10, 20].map((n) => (
                <Tap key={n} onPress={() => addPushups(today, n)} haptics={pushups < PUSHUP_GOAL && pushups + n >= PUSHUP_GOAL ? 'success' : 'tap'} className="flex-1 items-center rounded-2xl bg-raised py-3">
                  <Text className="text-[15px] font-bold text-ink">+{n}</Text>
                </Tap>
              ))}
            </View>
          </View>
        </Card>

        <Tap className="flex-1" haptics="pick" onPress={() => router.navigate('/wallet')}>
          <Card className="flex-1">
            <View style={{ gap: 14 }}>
              <Label>Wallet</Label>
              <Text className={`text-[34px] font-extrabold ${left < 0 ? 'text-glow' : 'text-ink'}`} numberOfLines={1} adjustsFontSizeToFit>
                {peso(left)}
              </Text>
              <Bar progress={budget ? spent / budget : 0} color={C.ink} overColor={C.accent} />
              <Text className="text-[13px] text-sub">{left >= 0 ? 'left today' : 'over budget'}</Text>
            </View>
          </Card>
        </Tap>
      </Animated.View>

      <Animated.View entering={enter(2)}>
        <Tap haptics="pick" onPress={() => router.navigate('/workout')}>
          <Card>
            <View className="flex-row items-center" style={{ gap: 16 }}>
              <Ring size={60} stroke={7} progress={allIds.length ? doneCount / allIds.length : 0}>
                <Ionicons name="barbell" size={22} color={C.accent} />
              </Ring>
              <View className="flex-1" style={{ gap: 4 }}>
                <Text className="text-[19px] font-bold text-ink">{plan.title}</Text>
                <Text className="text-[13px] text-sub">
                  {doneCount}/{allIds.length} done
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.dim} />
            </View>
          </Card>
        </Tap>
      </Animated.View>

      <Animated.View entering={enter(3)}>
        <Card>
          {nextMeal && nextSlot ? (
            <Tap haptics="success" onPress={() => toggleEaten(today, nextSlot.key)} className="flex-row items-center" style={{ gap: 16 }}>
              <View className="flex-1" style={{ gap: 6 }}>
                <Label>{`Next · ${nextSlot.label}`}</Label>
                <Text className="text-[18px] font-bold leading-[24px] text-ink">{nextMeal.name}</Text>
                <Text className="text-[13px] text-sub">
                  {peso(mealCost(nextMeal, priceFactor))} · {mealMacros(nextMeal).kcal} kcal · {mealMacros(nextMeal).protein}g protein
                </Text>
              </View>
              <Check on={false} size={32} />
            </Tap>
          ) : (
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <Ionicons name="checkmark-done-circle" size={30} color={C.accent} />
              <Text className="flex-1 text-[16px] font-semibold text-ink">All meals logged today</Text>
            </View>
          )}
        </Card>
      </Animated.View>

      <Animated.View entering={enter(4)}>
        <Tap haptics="pick" onPress={() => router.navigate('/me')}>
          <Card>
            <View className="flex-row" style={{ gap: 12 }}>
              <Stat label="BMI" value={b.toFixed(1)} color={bmiCategory(b).color} />
              <Stat label="Weight" value={`${profile.weightKg}kg`} />
              <Stat label="Waist/height" value={w ? w.toFixed(2) : '—'} color={w ? whtrCategory(w).color : C.dim} />
            </View>
          </Card>
        </Tap>
      </Animated.View>
    </Screen>
  );
}
