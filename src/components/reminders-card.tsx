import Ionicons from '@expo/vector-icons/Ionicons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Linking, Platform, Switch, Text, View } from 'react-native';

import { ensurePermission } from '@/lib/reminders';
import { timeText, type ReminderKey } from '@/lib/reminders-plan';
import { useStore } from '@/lib/store';
import { Button, C, Card, Label, Tap, type IconName } from './ui';

const ROWS: { key: ReminderKey; title: string; when: string; icon: IconName }[] = [
  { key: 'pushups', title: 'Push-ups', when: 'Daily, skipped once you hit 100', icon: 'barbell-outline' },
  { key: 'spending', title: 'Log spending', when: 'Daily, skipped if you logged today', icon: 'wallet-outline' },
  { key: 'waist', title: 'Waist check', when: 'Sundays, skipped if measured that week', icon: 'body-outline' },
];

export function RemindersCard() {
  const reminders = useStore((s) => s.reminders);
  const setReminder = useStore((s) => s.setReminder);
  const [blocked, setBlocked] = useState(false);

  const toggle = async (key: ReminderKey, on: boolean) => {
    if (!on) return setReminder(key, { on: false });
    const ok = await ensurePermission();
    setBlocked(!ok);
    if (ok) setReminder(key, { on: true });
  };

  const pickTime = (key: ReminderKey) => {
    if (Platform.OS !== 'android') return;
    const r = reminders[key];
    DateTimePickerAndroid.open({
      value: new Date(2000, 0, 1, r.hour, r.minute),
      mode: 'time',
      is24Hour: false,
      onChange: (event, date) => {
        if (event.type === 'set' && date) setReminder(key, { hour: date.getHours(), minute: date.getMinutes() });
      },
    });
  };

  return (
    <Card>
      <View style={{ gap: 18 }}>
        <Label>Reminders</Label>
        {ROWS.map((row) => {
          const r = reminders[row.key];
          return (
            <View key={row.key} className="flex-row items-center" style={{ gap: 14 }}>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-raised">
                <Ionicons name={row.icon} size={20} color={r.on ? C.accent : C.sub} />
              </View>
              <View className="flex-1" style={{ gap: 4 }}>
                <Text className="text-[16px] font-bold text-ink">{row.title}</Text>
                <Text className="text-[12px] leading-[17px] text-sub">{row.when}</Text>
                <Tap
                  onPress={() => pickTime(row.key)}
                  accessibilityLabel={`${row.title} reminder time, ${timeText(r)}. Tap to change`}
                  className="mt-1 flex-row items-center self-start rounded-full bg-raised px-3 py-1.5"
                  style={{ gap: 6 }}>
                  <Ionicons name="time-outline" size={13} color={C.sub} />
                  <Text className="text-[13px] font-semibold text-ink">{timeText(r)}</Text>
                </Tap>
              </View>
              <Switch
                value={r.on}
                onValueChange={(v) => toggle(row.key, v)}
                accessibilityLabel={`${row.title} reminder`}
                trackColor={{ true: C.fill, false: C.raised }}
                thumbColor={C.ink}
              />
            </View>
          );
        })}
        {blocked ? (
          <View style={{ gap: 10 }} accessibilityLiveRegion="polite">
            <Text className="text-[13px] leading-[19px] text-glow">Notifications are turned off for FitPeso. Allow them in Android settings to get reminders.</Text>
            <Button small variant="ghost" icon="settings-outline" label="Open settings" onPress={() => Linking.openSettings()} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
