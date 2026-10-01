import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Bar, Button, C, Card, Field, Header, IconButton, Ring, Screen, SectionTitle, Stat, Tap, haptic } from '@/components/ui';
import { addDays, fromKey, relativeDay, timeLabel } from '@/lib/date';
import { parseNum, peso } from '@/lib/format';
import { useToday } from '@/lib/hooks';
import { CATEGORIES, budgetFor, useStore, type Expense } from '@/lib/store';
import { byCategory, inRange, last7, payPeriod, totalOf } from '@/lib/wallet';

const SHORT_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function Wallet() {
  const today = useToday();
  const [day, setDay] = useState(today);
  const [seenToday, setSeenToday] = useState(today);
  if (seenToday !== today) {
    // Jump to the new day after midnight.
    setSeenToday(today);
    setDay(today);
  }
  const expenses = useStore((s) => s.expenses);
  const dailyBudgets = useStore((s) => s.dailyBudgets);
  const defaultDailyBudget = useStore((s) => s.defaultDailyBudget);
  const budget = useStore((s) => budgetFor(s, day));
  const salary = useStore((s) => s.salary);
  const schedule = useStore((s) => s.paySchedule);
  const { setDailyBudget, setSettings } = useStore.getState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [salaryDraft, setSalaryDraft] = useState('');

  const dayList = useMemo(() => expenses.filter((e) => e.day === day).sort((a, b) => b.ts - a.ts), [expenses, day]);
  const spent = totalOf(dayList);
  const left = budget - spent;

  const period = payPeriod(today, schedule, salary);
  const periodList = useMemo(() => expenses.filter((e) => inRange(e.day, period.start, period.end)), [expenses, period.start, period.end]);
  const periodSpent = totalOf(periodList);
  const periodLeft = period.income - periodSpent;
  const daysLeft = fromKey(period.end).getDate() - fromKey(today).getDate() + 1;
  const safePerDay = periodLeft / Math.max(1, daysLeft);
  const cats = byCategory(periodList);
  const week = last7(expenses, today);
  const weekMax = Math.max(1, ...week.map((w) => w.total));

  const saveBudget = () => {
    const n = parseNum(draft);
    if (n >= 0) {
      setDailyBudget(day, n);
      haptic.success();
    }
    setEditing(false);
  };

  return (
    <Screen>
      <Header
        eyebrow="Expense tracker"
        title="Wallet"
        right={
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <IconButton icon="chevron-back" size={34} onPress={() => setDay(addDays(day, -1))} />
            <Tap haptics="pick" onPress={() => setDay(today)}>
              <Text className="min-w-[78px] text-center text-[13px] font-bold text-ink">{relativeDay(day, today)}</Text>
            </Tap>
            <IconButton icon="chevron-forward" size={34} onPress={() => day < today && setDay(addDays(day, 1))} color={day < today ? C.ink : C.dim} />
          </View>
        }
      />

      <Card>
        <View className="flex-row items-center" style={{ gap: 18 }}>
          <Ring size={112} stroke={12} progress={budget ? spent / budget : 0} color={left < 0 ? C.rose : C.amber}>
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-sub">spent</Text>
            <Text className="text-[18px] font-extrabold text-ink">{peso(spent)}</Text>
          </Ring>
          <View className="flex-1" style={{ gap: 4 }}>
            <Text className="text-[12px] font-bold uppercase tracking-wider text-sub">{left >= 0 ? 'Left to spend' : 'Over budget by'}</Text>
            <Text className={`text-[34px] font-extrabold tracking-tight ${left < 0 ? 'text-rose' : 'text-ink'}`}>{peso(Math.abs(left))}</Text>
            {editing ? null : (
              <Tap haptics="pick" onPress={() => { setDraft(String(budget)); setEditing(true); }} className="flex-row items-center" style={{ gap: 6 }}>
                <Text className="text-[13px] text-sub">Budget {peso(budget)}</Text>
                <Ionicons name="create-outline" size={14} color={C.sub} />
              </Tap>
            )}
          </View>
        </View>
        {editing ? (
          <Animated.View entering={FadeIn} style={{ marginTop: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <Field label={`Budget for ${relativeDay(day, today).toLowerCase()}`} prefix="₱" keyboardType="number-pad" value={draft} onChangeText={setDraft} autoFocus onSubmitEditing={saveBudget} returnKeyType="done" />
            <Button label="Save" small onPress={saveBudget} />
          </Animated.View>
        ) : null}
      </Card>

      <Button label="Add expense" icon="add" onPress={() => router.push({ pathname: '/add-expense', params: { day } })} />

      <SectionTitle right={<Text className="text-[12px] font-semibold text-dim">{dayList.length} item{dayList.length === 1 ? '' : 's'}</Text>}>
        {relativeDay(day, today)}’s spending
      </SectionTitle>
      {dayList.length === 0 ? (
        <Card className="items-center py-8">
          <Ionicons name="receipt-outline" size={30} color={C.dim} />
          <Text className="mt-2 text-[14px] text-sub">No expenses yet. Log every peso!</Text>
        </Card>
      ) : (
        <View style={{ gap: 8 }}>
          {dayList.map((e) => (
            <ExpenseRow key={e.id} e={e} />
          ))}
        </View>
      )}

      <SectionTitle right={<Text className="text-[12px] font-semibold text-dim">{period.label}</Text>}>Pay period</SectionTitle>
      {salary > 0 ? (
        <Card>
          <View className="flex-row" style={{ gap: 12 }}>
            <Stat label="Income" value={peso(period.income)} sub={schedule === 'kinsenas' ? 'half salary' : 'salary'} />
            <Stat label="Spent" value={peso(periodSpent)} color={C.amber} sub={`${Math.round((periodSpent / Math.max(1, period.income)) * 100)}% used`} />
            <Stat label="Left" value={peso(periodLeft)} color={periodLeft < 0 ? C.rose : C.mint} sub={`${daysLeft} day${daysLeft === 1 ? '' : 's'} left`} />
          </View>
          <View className="my-3">
            <Bar progress={periodSpent / Math.max(1, period.income)} color={C.mint} />
          </View>
          <View className="flex-row items-center rounded-2xl bg-raised p-3" style={{ gap: 10 }}>
            <Ionicons name={safePerDay >= budget ? 'shield-checkmark' : 'warning'} size={20} color={safePerDay >= budget ? C.mint : C.amber} />
            <Text className="flex-1 text-[13px] leading-[18px] text-sub">
              {periodLeft <= 0
                ? 'Your money for this pay period is used up. Only spend on essentials until payday.'
                : `You can safely spend ${peso(safePerDay)}/day until payday${safePerDay < budget ? `, which is less than your ${peso(budget)} daily budget. Tighten up a bit.` : '. You are on track to save.'}`}
            </Text>
          </View>
        </Card>
      ) : (
        <Card>
          <Text className="mb-3 text-[14px] leading-[20px] text-sub">Add your monthly salary to see how much you can safely spend each day until payday.</Text>
          <View className="flex-row items-end" style={{ gap: 10 }}>
            <Field label="Monthly salary" prefix="₱" keyboardType="number-pad" value={salaryDraft} onChangeText={setSalaryDraft} placeholder="18000" />
            <Button small label="Save" onPress={() => parseNum(salaryDraft) > 0 && setSettings({ salary: parseNum(salaryDraft) })} />
          </View>
        </Card>
      )}

      <SectionTitle>Last 7 days</SectionTitle>
      <Card>
        <View className="h-[130px] flex-row items-end justify-between" style={{ gap: 8 }}>
          {week.map((w) => {
            const over = w.total > budgetFor({ dailyBudgets, defaultDailyBudget }, w.day);
            const isSel = w.day === day;
            return (
              <Tap key={w.day} haptics="pick" onPress={() => setDay(w.day)} className="flex-1 items-center" style={{ gap: 6 }}>
                <Text className="text-[10px] font-semibold text-dim">{w.total ? (w.total >= 1000 ? `${(w.total / 1000).toFixed(1)}k` : Math.round(w.total)) : ''}</Text>
                <View style={{ height: Math.max(4, (w.total / weekMax) * 84), width: '100%', borderRadius: 8, backgroundColor: over ? C.rose : isSel ? C.amber : `${C.amber}55` }} />
                <Text className={`text-[11px] font-bold ${isSel ? 'text-ink' : 'text-dim'}`}>{SHORT_DAYS[fromKey(w.day).getDay()]}</Text>
              </Tap>
            );
          })}
        </View>
      </Card>

      {cats.length ? (
        <>
          <SectionTitle>Where it went ({period.label})</SectionTitle>
          <Card>
            <View style={{ gap: 12 }}>
              {cats.map((c) => {
                const meta = CATEGORIES[c.key];
                return (
                  <View key={c.key} style={{ gap: 6 }}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center" style={{ gap: 8 }}>
                        <Ionicons name={meta.icon} size={16} color={meta.color} />
                        <Text className="text-[14px] font-semibold text-ink">{meta.label}</Text>
                      </View>
                      <Text className="text-[14px] font-bold text-ink">
                        {peso(c.total)} <Text className="text-[12px] font-semibold text-dim">{Math.round((c.total / periodSpent) * 100)}%</Text>
                      </Text>
                    </View>
                    <Bar progress={c.total / cats[0].total} color={meta.color} height={6} />
                  </View>
                );
              })}
            </View>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function ExpenseRow({ e }: { e: Expense }) {
  const [open, setOpen] = useState(false);
  const remove = useStore((s) => s.removeExpense);
  const meta = CATEGORIES[e.category] ?? CATEGORIES.other;
  return (
    <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOut.duration(180)} layout={LinearTransition.duration(220)}>
      <Tap haptics="pick" onPress={() => setOpen((o) => !o)} className="flex-row items-center rounded-2xl border border-line bg-card p-3.5" style={{ gap: 12 }}>
        <View style={{ backgroundColor: `${meta.color}22` }} className="h-11 w-11 items-center justify-center rounded-xl">
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>
            {e.note || meta.label}
          </Text>
          <Text className="text-[12px] text-sub">
            {meta.label} · {timeLabel(e.ts)}
            {e.mealSlot ? ' · from meal plan' : ''}
          </Text>
        </View>
        {open ? (
          <Animated.View entering={FadeIn.duration(150)}>
            <Button small variant="danger" icon="trash-outline" label="Delete" onPress={() => remove(e.id)} />
          </Animated.View>
        ) : (
          <Text className="text-[16px] font-extrabold text-ink">-{peso(e.amount, e.amount % 1 !== 0)}</Text>
        )}
      </Tap>
    </Animated.View>
  );
}
