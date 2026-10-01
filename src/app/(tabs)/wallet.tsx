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
  const budget = budgetFor({ dailyBudgets, defaultDailyBudget }, day);
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
        eyebrow="Expenses"
        title="Wallet"
        right={
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <IconButton icon="chevron-back" size={38} onPress={() => setDay(addDays(day, -1))} />
            <Tap haptics="pick" onPress={() => setDay(today)}>
              <Text className="min-w-[82px] text-center text-[14px] font-bold text-ink">{relativeDay(day, today)}</Text>
            </Tap>
            <IconButton icon="chevron-forward" size={38} disabled={day >= today} onPress={() => setDay(addDays(day, 1))} />
          </View>
        }
      />

      <Card>
        <View className="flex-row items-center" style={{ gap: 22 }}>
          <Ring size={120} stroke={13} progress={budget ? spent / budget : 0} color={left < 0 ? C.warn : C.accent}>
            <Text className="text-[12px] font-semibold text-sub">spent</Text>
            <Text className="text-[19px] font-extrabold text-ink">{peso(spent)}</Text>
          </Ring>
          <View className="flex-1" style={{ gap: 6 }}>
            <Text className="text-[13px] font-semibold text-sub">{left >= 0 ? 'Left' : 'Over by'}</Text>
            <Text className={`text-[36px] font-extrabold tracking-tight ${left < 0 ? 'text-warn' : 'text-ink'}`} numberOfLines={1} adjustsFontSizeToFit>
              {peso(Math.abs(left))}
            </Text>
            {editing ? null : (
              <Tap haptics="pick" onPress={() => { setDraft(String(budget)); setEditing(true); }} className="flex-row items-center self-start rounded-full bg-raised px-3 py-1.5" style={{ gap: 6 }}>
                <Text className="text-[13px] font-semibold text-sub">of {peso(budget)}</Text>
                <Ionicons name="pencil" size={12} color={C.sub} />
              </Tap>
            )}
          </View>
        </View>
        {editing ? (
          <Animated.View entering={FadeIn} style={{ marginTop: 18, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <Field label="Budget" prefix="₱" keyboardType="number-pad" value={draft} onChangeText={setDraft} autoFocus onSubmitEditing={saveBudget} returnKeyType="done" />
            <Button label="Save" small onPress={saveBudget} />
          </Animated.View>
        ) : null}
      </Card>

      <Button label="Add expense" icon="add" onPress={() => router.push({ pathname: '/add-expense', params: { day } })} />

      {dayList.length === 0 ? (
        <View className="items-center py-6" style={{ gap: 10 }}>
          <Ionicons name="receipt-outline" size={30} color={C.dim} />
          <Text className="text-[14px] text-dim">Nothing logged yet</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {dayList.map((e) => (
            <ExpenseRow key={e.id} e={e} />
          ))}
        </View>
      )}

      <SectionTitle right={<Text className="text-[13px] font-semibold text-dim">{period.label}</Text>}>Pay period</SectionTitle>
      {salary > 0 ? (
        <Card>
          <View style={{ gap: 18 }}>
            <View className="flex-row" style={{ gap: 12 }}>
              <Stat label="Income" value={peso(period.income)} />
              <Stat label="Spent" value={peso(periodSpent)} />
              <Stat label="Left" value={peso(periodLeft)} color={periodLeft < 0 ? C.warn : C.ink} />
            </View>
            <Bar progress={periodSpent / Math.max(1, period.income)} />
            <View className="flex-row items-center rounded-[20px] bg-raised px-4 py-4" style={{ gap: 12 }}>
              <Ionicons name={periodLeft > 0 && safePerDay >= budget ? 'shield-checkmark' : 'warning'} size={22} color={periodLeft > 0 && safePerDay >= budget ? C.accent : C.warn} />
              <View className="flex-1">
                <Text className="text-[16px] font-bold text-ink">{periodLeft > 0 ? `${peso(safePerDay)}/day` : 'Essentials only'}</Text>
                <Text className="text-[13px] text-sub">{periodLeft > 0 ? `safe until payday · ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : 'until payday'}</Text>
              </View>
            </View>
          </View>
        </Card>
      ) : (
        <Card>
          <View className="flex-row items-end" style={{ gap: 12 }}>
            <Field label="Monthly salary" prefix="₱" keyboardType="number-pad" value={salaryDraft} onChangeText={setSalaryDraft} placeholder="18,000" />
            <Button small label="Save" onPress={() => parseNum(salaryDraft) > 0 && setSettings({ salary: parseNum(salaryDraft) })} />
          </View>
        </Card>
      )}

      <SectionTitle>Last 7 days</SectionTitle>
      <Card>
        <View className="h-[140px] flex-row items-end justify-between" style={{ gap: 10 }}>
          {week.map((w) => {
            const over = w.total > budgetFor({ dailyBudgets, defaultDailyBudget }, w.day);
            const isSel = w.day === day;
            return (
              <Tap key={w.day} haptics="pick" onPress={() => setDay(w.day)} className="flex-1 items-center" style={{ gap: 8 }}>
                <Text className="text-[10px] font-semibold text-dim">{w.total ? (w.total >= 1000 ? `${(w.total / 1000).toFixed(1)}k` : Math.round(w.total)) : ''}</Text>
                <View style={{ height: Math.max(4, (w.total / weekMax) * 84), width: '100%', borderRadius: 8, backgroundColor: over ? C.warn : isSel ? C.accent : 'rgba(226,35,45,0.35)' }} />
                <Text className="text-[12px] font-bold" style={{ color: isSel ? C.ink : C.dim }}>
                  {SHORT_DAYS[fromKey(w.day).getDay()]}
                </Text>
              </Tap>
            );
          })}
        </View>
      </Card>

      {cats.length ? (
        <>
          <SectionTitle right={<Text className="text-[13px] font-semibold text-dim">{period.label}</Text>}>Where it went</SectionTitle>
          <Card>
            <View style={{ gap: 16 }}>
              {cats.map((c, i) => {
                const meta = CATEGORIES[c.key];
                return (
                  <View key={c.key} style={{ gap: 8 }}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center" style={{ gap: 10 }}>
                        <Ionicons name={meta.icon} size={17} color={C.sub} />
                        <Text className="text-[15px] font-semibold text-ink">{meta.label}</Text>
                      </View>
                      <Text className="text-[15px] font-bold text-ink">
                        {peso(c.total)} <Text className="text-[13px] font-semibold text-dim">{Math.round((c.total / periodSpent) * 100)}%</Text>
                      </Text>
                    </View>
                    <Bar progress={c.total / cats[0].total} color={i === 0 ? C.accent : 'rgba(226,35,45,0.45)'} height={6} />
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
      <Tap haptics="pick" onPress={() => setOpen((o) => !o)} className="flex-row items-center rounded-[24px] border border-line bg-card px-4 py-4" style={{ gap: 14 }}>
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-raised">
          <Ionicons name={meta.icon} size={21} color={C.accent} />
        </View>
        <View className="flex-1" style={{ gap: 2 }}>
          <Text className="text-[16px] font-bold text-ink" numberOfLines={1}>
            {e.note || meta.label}
          </Text>
          <Text className="text-[13px] text-sub">
            {meta.label} · {timeLabel(e.ts)}
          </Text>
        </View>
        {open ? (
          <Animated.View entering={FadeIn.duration(150)}>
            <Button small variant="danger" icon="trash-outline" label="Delete" onPress={() => remove(e.id)} />
          </Animated.View>
        ) : (
          <Text className="text-[17px] font-extrabold text-ink">-{peso(e.amount, e.amount % 1 !== 0)}</Text>
        )}
      </Tap>
    </Animated.View>
  );
}
