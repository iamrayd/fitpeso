import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Bar, C, Card, Check, Header, MacroBar, Pill, Ring, Screen, Stat, Tap } from '@/components/ui';
import { MEALS_BY_ID, SLOTS, mealCost, mealMacros } from '@/data/foods';
import { POSTURE, PUSHUP_GOAL, WEEK } from '@/data/workouts';
import { greeting, prettyDate, weekdayIndex } from '@/lib/date';
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
  const bc = bmiCategory(b);
  const w = whtr(profile);

  return (
    <Screen>
      <Header eyebrow={prettyDate(today)} title={`${greeting()}, ${profile.name.split(' ')[0]}`} />

      <Animated.View entering={enter(0)}>
        <Card>
          <View className="flex-row items-center" style={{ gap: 18 }}>
            <Ring size={128} stroke={13} progress={eaten.kcal / t.kcal} color={eaten.kcal > t.kcal ? C.rose : C.lime}>
              <Text className="text-[26px] font-extrabold text-ink">{Math.abs(kcalLeft)}</Text>
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-sub">{kcalLeft >= 0 ? 'kcal left' : 'kcal over'}</Text>
            </Ring>
            <View className="flex-1" style={{ gap: 12 }}>
              <MacroBar label="Protein" value={eaten.protein} target={t.protein} color={C.lime} />
              <MacroBar label="Carbs" value={eaten.carbs} target={t.carbs} color={C.sky} />
              <MacroBar label="Fat" value={eaten.fat} target={t.fat} color={C.amber} />
            </View>
          </View>
          <Text className="mt-3 text-[12px] text-dim">
            {eaten.kcal} of {t.kcal} kcal eaten · protein is the priority for losing belly fat
          </Text>
        </Card>
      </Animated.View>

      <Animated.View entering={enter(1)} style={{ flexDirection: 'row', gap: 14 }}>
        <Card className="flex-1">
          <View style={{ gap: 10 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-bold uppercase tracking-wider text-sub">Push-ups</Text>
              {pushups >= PUSHUP_GOAL ? <Ionicons name="trophy" size={16} color={C.amber} /> : null}
            </View>
            <Text className="text-[30px] font-extrabold text-ink">
              {pushups}
              <Text className="text-[16px] text-dim">/{PUSHUP_GOAL}</Text>
            </Text>
            <Bar progress={pushups / PUSHUP_GOAL} color={C.lime} overColor={C.lime} />
            <View className="flex-row" style={{ gap: 6 }}>
              {[10, 20].map((n) => (
                <Tap key={n} onPress={() => addPushups(today, n)} haptics={pushups + n >= PUSHUP_GOAL && pushups < PUSHUP_GOAL ? 'success' : 'tap'} className="flex-1 items-center rounded-xl bg-raised py-2">
                  <Text className="text-[14px] font-bold text-lime">+{n}</Text>
                </Tap>
              ))}
            </View>
          </View>
        </Card>

        <Tap className="flex-1" haptics="pick" onPress={() => router.navigate('/wallet')}>
          <Card className="flex-1">
            <View style={{ gap: 10 }}>
              <Text className="text-[13px] font-bold uppercase tracking-wider text-sub">Wallet</Text>
              <Text className={`text-[30px] font-extrabold ${left < 0 ? 'text-rose' : 'text-ink'}`}>{peso(left)}</Text>
              <Bar progress={budget ? spent / budget : 0} color={C.amber} />
              <Text className="text-[12px] text-sub">
                {left >= 0 ? 'left today' : 'over budget'} · spent {peso(spent)}
              </Text>
            </View>
          </Card>
        </Tap>
      </Animated.View>

      <Animated.View entering={enter(2)}>
        <Tap haptics="pick" onPress={() => router.navigate('/workout')}>
          <Card>
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <Ring size={58} stroke={7} progress={allIds.length ? doneCount / allIds.length : 0} color={C.mint}>
                <Ionicons name="barbell" size={20} color={C.mint} />
              </Ring>
              <View className="flex-1" style={{ gap: 3 }}>
                <Text className="text-[12px] font-bold uppercase tracking-wider text-sub">Today’s training</Text>
                <Text className="text-[18px] font-bold text-ink">{plan.title}</Text>
                <Text className="text-[13px] text-sub">
                  {doneCount}/{allIds.length} done · ~{plan.minutes + 10} min with posture work
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
            <View style={{ gap: 10 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-bold uppercase tracking-wider text-sub">Up next · {nextSlot.label}</Text>
                <Pill label={peso(mealCost(nextMeal, priceFactor))} color={C.amber} />
              </View>
              <Tap haptics="success" onPress={() => toggleEaten(today, nextSlot.key)} className="flex-row items-center" style={{ gap: 12 }}>
                <View className="flex-1">
                  <Text className="text-[17px] font-bold text-ink">{nextMeal.name}</Text>
                  <Text className="text-[13px] text-sub">
                    {mealMacros(nextMeal).kcal} kcal · {mealMacros(nextMeal).protein} g protein
                  </Text>
                </View>
                <Check on={false} />
              </Tap>
            </View>
          ) : (
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Ionicons name="checkmark-done-circle" size={30} color={C.lime} />
              <Text className="flex-1 text-[15px] font-semibold text-ink">All of today’s meals are logged. Nice!</Text>
            </View>
          )}
        </Card>
      </Animated.View>

      <Animated.View entering={enter(4)}>
        <Tap haptics="pick" onPress={() => router.navigate('/me')}>
          <Card>
            <View className="flex-row" style={{ gap: 12 }}>
              <Stat label="BMI" value={b.toFixed(1)} sub={bc.label} color={bc.color} />
              <Stat label="Weight" value={`${profile.weightKg} kg`} sub={`${profile.heightCm} cm`} />
              {w ? <Stat label="Waist / height" value={w.toFixed(2)} sub={whtrCategory(w).label} color={whtrCategory(w).color} /> : <Stat label="Waist" value="—" sub="Add in Me" />}
            </View>
          </Card>
        </Tap>
      </Animated.View>
    </Screen>
  );
}
