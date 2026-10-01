import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { C, Card, Check, Header, Ring, Screen, SectionTitle, Tap, Tip } from '@/components/ui';
import { POSTURE, PUSHUP_GOAL, PUSHUP_TIPS, WEEK, type Exercise } from '@/data/workouts';
import { addDays, relativeDay, weekdayIndex } from '@/lib/date';
import { useToday } from '@/lib/hooks';
import { useStore } from '@/lib/store';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const KIND_ICON = { dumbbell: 'barbell-outline', bodyweight: 'body-outline', cardio: 'walk-outline', mobility: 'leaf-outline' } as const;
const POSTURE_TIP = 'Your arched lower back pushes your belly forward. This 10-minute routine stretches tight hip flexors and wakes up your glutes and core. Do it every day.';

export default function Workout() {
  const today = useToday();
  const todayIdx = weekdayIndex(today);
  const [sel, setSel] = useState(todayIdx);
  const [tip, setTip] = useState<'posture' | 'pushups' | null>(null);
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
      <Header eyebrow="This week" title="Train" />

      <View className="flex-row justify-between">
        {DAY_LETTERS.map((l, i) => {
          const on = i === sel;
          return (
            <Tap key={i} haptics="pick" onPress={() => setSel(i)} className="items-center rounded-[18px] py-3" style={{ width: 44, gap: 8, backgroundColor: on ? C.accent : C.card }}>
              <Text className="text-[14px] font-bold" style={{ color: on ? C.ink : i === todayIdx ? C.accent : C.sub }}>
                {l}
              </Text>
              <Ring size={20} stroke={3} progress={weekProgress[i]} color={on ? C.ink : C.accent} track={on ? 'rgba(255,255,255,0.25)' : C.raised} />
            </Tap>
          );
        })}
      </View>

      <Animated.View key={sel} entering={FadeIn.duration(250)} style={{ gap: 20 }}>
        <Card>
          <View className="flex-row items-center" style={{ gap: 16 }}>
            <View className="flex-1" style={{ gap: 6 }}>
              <Text className="text-[13px] font-semibold text-dim">
                {relativeDay(day, today)} · ~{plan.minutes} min
              </Text>
              <Text className="text-[24px] font-extrabold tracking-tight text-ink">{plan.title}</Text>
              <Text className="text-[14px] text-sub">{plan.focus}</Text>
            </View>
            <Ring size={68} stroke={7} progress={finished / total}>
              <Text className="text-[15px] font-extrabold text-ink">
                {finished}/{total}
              </Text>
            </Ring>
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          {plan.exercises.map((e, i) => (
            <ExerciseRow key={e.id} e={e} index={i} done={done.includes(e.id)} disabled={isFuture} onToggle={() => toggle(day, e.id)} />
          ))}
        </View>

        <SectionTitle right={<Text className="text-[13px] font-semibold text-dim">10 min daily</Text>}>Posture fix</SectionTitle>
        <Tip text={POSTURE_TIP} open={tip === 'posture'} onToggle={() => setTip(tip === 'posture' ? null : 'posture')} />
        <View style={{ gap: 10 }}>
          {POSTURE.map((e, i) => (
            <ExerciseRow key={e.id} e={e} index={i} done={done.includes(e.id)} disabled={isFuture} onToggle={() => toggle(day, e.id)} />
          ))}
        </View>
      </Animated.View>

      <SectionTitle right={<Text className="text-[13px] font-semibold text-dim">{relativeDay(day, today)}</Text>}>100 push-ups</SectionTitle>
      <Card>
        <View className="items-center" style={{ gap: 20 }}>
          <Ring size={168} stroke={15} progress={pushups / PUSHUP_GOAL}>
            <Text className="text-[46px] font-extrabold text-ink">{pushups}</Text>
            <Text className="text-[13px] font-semibold text-sub">{pushups >= PUSHUP_GOAL ? 'Done!' : `${PUSHUP_GOAL - pushups} to go`}</Text>
          </Ring>
          <View className="w-full flex-row" style={{ gap: 8 }}>
            {[-5, 5, 10, 20, 25].map((n) => (
              <Tap
                key={n}
                disabled={isFuture || (n < 0 && pushups === 0)}
                haptics={n > 0 && pushups < PUSHUP_GOAL && pushups + n >= PUSHUP_GOAL ? 'success' : 'tap'}
                onPress={() => addPushups(day, n)}
                className="flex-1 items-center rounded-2xl py-4"
                style={{ backgroundColor: n < 0 ? C.raised : 'rgba(226,35,45,0.14)' }}>
                <Text className="text-[16px] font-extrabold" style={{ color: n < 0 ? C.sub : C.ink }}>
                  {n > 0 ? `+${n}` : n}
                </Text>
              </Tap>
            ))}
          </View>
          <View className="w-full">
            <Tip text={PUSHUP_TIPS.join('\n\n')} open={tip === 'pushups'} onToggle={() => setTip(tip === 'pushups' ? null : 'pushups')} />
          </View>
        </View>
      </Card>
    </Screen>
  );
}

function ExerciseRow({ e, index, done, disabled, onToggle }: { e: Exercise; index: number; done: boolean; disabled: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)} layout={LinearTransition.duration(220)}>
      <Tap
        haptics="pick"
        onPress={() => setOpen((o) => !o)}
        className="rounded-[24px] border px-4 py-4"
        style={{ borderColor: done ? 'rgba(226,35,45,0.35)' : C.line, backgroundColor: done ? 'rgba(226,35,45,0.06)' : C.card }}>
        <View className="flex-row items-center" style={{ gap: 14 }}>
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-raised">
            <Ionicons name={KIND_ICON[e.kind]} size={20} color={done ? C.accent : C.sub} />
          </View>
          <View className="flex-1" style={{ gap: 2 }}>
            <Text className={`text-[16px] font-bold ${done ? 'text-dim line-through' : 'text-ink'}`}>{e.name}</Text>
            <Text className="text-[13px] text-sub">
              {e.sets > 1 ? `${e.sets} × ` : ''}
              {e.reps}
            </Text>
          </View>
          <Tap haptics={done ? 'tap' : 'success'} disabled={disabled} onPress={onToggle} hitSlop={12}>
            <Check on={done} />
          </Tap>
        </View>
        {open ? (
          <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: 14, gap: 6 }}>
            {e.rest ? <Text className="text-[13px] font-semibold text-dim">Rest {e.rest}</Text> : null}
            <Text className="text-[14px] leading-[21px] text-sub">{e.cue}</Text>
          </Animated.View>
        ) : null}
      </Tap>
    </Animated.View>
  );
}
