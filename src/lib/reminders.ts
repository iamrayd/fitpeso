import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { dateKey } from './date';
import { planReminders, type ReminderKey } from './reminders-plan';
import { useStore } from './store';

const CHANNEL = 'reminders';
const KEYS: ReminderKey[] = ['pushups', 'spending', 'waist'];
const isOurs = (id: string) => KEYS.some((k) => id.startsWith(`${k}-`));

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Reminders',
    description: 'Push-ups, spending log and weekly waist check',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#E2232D',
  });
}

/** Asks for notification permission if needed. Returns whether reminders can be shown. */
export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureChannel(); // Android only shows the permission prompt once a channel exists
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

function inputFromStore() {
  const s = useStore.getState();
  const pushups: Record<string, number> = {};
  for (const [day, w] of Object.entries(s.workouts)) pushups[day] = w.pushups;
  const lastWaist = [...s.body].reverse().find((b) => b.waistCm !== null);
  return {
    reminders: s.reminders,
    pushups,
    expenseDays: new Set(s.expenses.map((e) => e.day)),
    lastWaistDay: lastWaist?.day ?? null,
  };
}

let queue: Promise<void> = Promise.resolve();

/**
 * Makes the scheduled notifications match the current data: cancels ours and
 * schedules the next two weeks again. Calls are queued so they never overlap.
 */
export function syncReminders(): Promise<void> {
  queue = queue.then(doSync).catch(() => {});
  return queue;
}

async function doSync() {
  if (Platform.OS === 'web') return;
  const input = inputFromStore();
  const anyOn = KEYS.some((k) => input.reminders[k].on);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((n) => isOurs(n.identifier)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  if (!anyOn || !(await Notifications.getPermissionsAsync()).granted) return;
  await ensureChannel();
  for (const r of planReminders(new Date(), input)) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, body: r.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.date, channelId: CHANNEL },
    });
  }
}

/**
 * Keeps reminders in sync for the life of the app: on launch, when the app
 * comes back to the foreground, and shortly after relevant data changes.
 * Returns a cleanup function.
 */
export function startReminderSync(): () => void {
  if (Platform.OS === 'web') return () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(syncReminders, 1500);
  };

  // Only what changes a reminder decision: settings, today's push-ups, logging, waist entries.
  const fingerprint = () => {
    const s = useStore.getState();
    const today = dateKey();
    return JSON.stringify([s.reminders, s.workouts[today]?.pushups ?? 0, s.expenses.length, s.body.length]);
  };
  let last = fingerprint();
  const unsubStore = useStore.subscribe(() => {
    const next = fingerprint();
    if (next !== last) {
      last = next;
      later();
    }
  });
  const appState = AppState.addEventListener('change', (st) => st === 'active' && syncReminders());
  syncReminders();

  return () => {
    clearTimeout(timer);
    unsubStore();
    appState.remove();
  };
}
