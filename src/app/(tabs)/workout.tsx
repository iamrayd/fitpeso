import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { C, Card, Check, Header, Pill, Ring, Screen, SectionTitle, Tap } from '@/components/ui';
import { POSTURE, PUSHUP_GOAL, PUSHUP_TIPS, WEEK, type Exercise } from '@/data/workouts';
import { addDays, relativeDay, weekdayIndex } from '@/lib/date';
import { useToday } from '@/lib/hooks';
import { useStore } from '@/lib/store';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const TYPE_COLOR = { strength: C.lime, conditioning: C.rose, recovery: C.sky, rest: C.violet } as const;
const KIND_ICON = { dumbbell: 'barbell-outline', bodyweight: 'body-outline', cardio: 'walk-outline', mobility: 'leaf-outline' } as const;

export default function Workout() {
  const today = useToday();
  const todayIdx = weekdayIndex(today);
  const [sel, setSel] = useState(todayIdx);
  const day = addDays(today, sel - todayIdx); // the actual date of the selected weekday this week
  const plan = WEEK[sel];
  const workouts = useStore((s) => s.workouts);
  const toggle = useStore((s) => s.toggleExercise);
  const addPushups = useStore((s) => s.addPushups);
  const done = workouts[day]?.done ?? [];
  const pushups = workouts[day]?.pushups ?? 0;
  const isFuture = day > today;

  const weekProgress = WEEK.map((p, i) => {
    const k = addDays(today, i - todayIdx);
    const ids = [...p.exercises, ...POSTURE].map((e) => e.id);
    const d = workouts[k]?.done ?? [];
    return ids.length ? ids.filter((id) => d.includes(id)).length / ids.length : 0;
  });

  const total = plan.exercises.length + POSTURE.length;
  const finished = [...plan.exercises, ...POSTURE].filter((e) => done.includes(e.id)).length;

  return (
    <Screen>
      <Header eyebrow="Weekly plan" title="Train" />

      <View className="flex-row justify-between">
        {DAY_LETTERS.map((l, i) => {
          const on = i === sel;
          return (
            <Tap key={i} haptics="pick" onPress={() => setSel(i)} className={`items-center rounded-2xl py-2.5 ${on ? 'bg-ink' : 'bg-card'}`} style={{ width: 44, gap: 6 }}>
              <Text className={`text-[13px] font-bold ${on ? 'text-bg' : i === todayIdx ? 'text-lime' : 'text-sub'}`}>{l}</Text>
              <Ring size={22} stroke={3} progress={weekProgress[i]} color={TYPE_COLOR[WEEK[i].type]} track={on ? '#D0D3D9' : C.raised} />
            </Tap>
          );
        })}
      </View>

      <Animated.View key={sel} entering={FadeIn.duration(250)} style={{ gap: 14 }}>
        <Card>
          <View className="flex-row items-center" style={{ gap: 14 }}>
            <View className="flex-1" style={{ gap: 6 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Pill label={plan.type} color={TYPE_COLOR[plan.type]} />
                <Text className="text-[12px] font-semibold text-dim">{relativeDay(day, today)}</Text>
              </View>
              <Text className="text-[22px] font-extrabold tracking-tight text-ink">{plan.title}</Text>
              <Text className="text-[13px] text-sub">
                {plan.focus} · ~{plan.minutes} min
              </Text>
            </View>
            <Ring size={64} stroke={7} progress={finished / total} color={TYPE_COLOR[plan.type]}>
              <Text className="text-[14px] font-extrabold text-ink">
                {finished}/{total}
              </Text>
            </Ring>
          </View>
          {plan.type === 'strength' ? (
            <Text className="mt-3 text-[12px] leading-[17px] text-dim">
              Use a weight where the last 2 reps of each set are hard. When you can do the top of the rep range for every set, go slower or add a rep.
            </Text>
          ) : null}
        </Card>

        <SectionTitle>Workout</SectionTitle>
        <View style={{ gap: 8 }}>
          {plan.exercises.map((e, i) => (
            <ExerciseRow key={e.id} e={e} index={i} done={done.includes(e.id)} disabled={isFuture} onToggle={() => toggle(day, e.id)} />
          ))}
        </View>

        <SectionTitle right={<Text className="text-[12px] font-semibold text-dim">Every day · 10 min</Text>}>Posture fix</SectionTitle>
        <Card className="border-sky/30 bg-sky/5">
          <View className="flex-row" style={{ gap: 10 }}>
            <Ionicons name="information-circle" size={20} color={C.sky} />
            <Text className="flex-1 text-[13px] leading-[19px] text-sub">
              Your arched lower back (anterior pelvic tilt) pushes your belly forward. Tight hip flexors plus weak glutes and core cause it. This routine fixes the posture; the diet and training burn the fat.
            </Text>
          </View>
        </Card>
        <View style={{ gap: 8 }}>
          {POSTURE.map((e, i) => (
            <ExerciseRow key={e.id} e={e} index={i} done={done.includes(e.id)} disabled={isFuture} onToggle={() => toggle(day, e.id)} />
          ))}
        </View>
      </Animated.View>

      <SectionTitle right={<Text className="text-[12px] font-semibold text-dim">{relativeDay(day, today)}</Text>}>100 push-ups</SectionTitle>
      <Card>
        <View className="items-center" style={{ gap: 14 }}>
          <Ring size={150} stroke={14} progress={pushups / PUSHUP_GOAL} color={pushups >= PUSHUP_GOAL ? C.amber : C.lime}>
            <Text className="text-[40px] font-extrabold text-ink">{pushups}</Text>
            <Text className="text-[12px] font-semibold uppercase tracking-wider text-sub">{pushups >= PUSHUP_GOAL ? 'Goal hit!' : `${PUSHUP_GOAL - pushups} to go`}</Text>
          </Ring>
          <View className="w-full flex-row" style={{ gap: 8 }}>
            {[-5, 5, 10, 20, 25].map((n) => (
              <Tap
                key={n}
                disabled={isFuture || (n < 0 && pushups === 0)}
                haptics={n > 0 && pushups < PUSHUP_GOAL && pushups + n >= PUSHUP_GOAL ? 'success' : 'tap'}
                onPress={() => addPushups(day, n)}
                className={`flex-1 items-center rounded-2xl py-3 ${n < 0 ? 'bg-raised' : 'bg-lime/15'}`}>
                <Text className={`text-[15px] font-extrabold ${n < 0 ? 'text-sub' : 'text-lime'}`}>{n > 0 ? `+${n}` : n}</Text>
              </Tap>
            ))}
          </View>
        </View>
        <View className="mt-4" style={{ gap: 8 }}>
          {PUSHUP_TIPS.map((tip) => (
            <View key={tip} className="flex-row" style={{ gap: 8 }}>
              <Text className="text-lime">•</Text>
              <Text className="flex-1 text-[13px] leading-[19px] text-sub">{tip}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

function ExerciseRow({ e, index, done, disabled, onToggle }: { e: Exercise; index: number; done: boolean; disabled: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)} layout={LinearTransition.duration(220)}>
      <Tap haptics="pick" onPress={() => setOpen((o) => !o)} className={`rounded-2xl border p-3.5 ${done ? 'border-lime/30 bg-lime/5' : 'border-line bg-card'}`}>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-raised">
            <Ionicons name={KIND_ICON[e.kind]} size={20} color={done ? C.lime : C.sub} />
          </View>
          <View className="flex-1">
            <Text className={`text-[15px] font-bold ${done ? 'text-sub line-through' : 'text-ink'}`}>{e.name}</Text>
            <Text className="text-[13px] text-sub">
              {e.sets > 1 ? `${e.sets} × ` : ''}
              {e.reps}
              {e.rest ? ` · rest ${e.rest}` : ''}
            </Text>
          </View>
          <Tap haptics={done ? 'tap' : 'success'} disabled={disabled} onPress={onToggle} hitSlop={10}>
            <Check on={done} />
          </Tap>
        </View>
        {open ? (
          <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
            <Ionicons name="bulb-outline" size={16} color={C.amber} style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[13px] leading-[19px] text-sub">{e.cue}</Text>
          </Animated.View>
        ) : null}
      </Tap>
    </Animated.View>
  );
}
