import { useState } from 'react';
import { Text, View } from 'react-native';

import { exportBackup, pickBackup } from '@/lib/backup';
import type { AppData } from '@/lib/store';
import { useStore } from '@/lib/store';
import { Button, Card, Label } from './ui';

type Pending = { data: AppData; skipped: number };

/** Back up to a file you keep anywhere, or restore from one (after confirming). */
export function BackupCard() {
  const importData = useStore((s) => s.importData);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const backup = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await exportBackup();
      setMessage({ text: 'Backup created. Keep it somewhere safe, like Google Drive.' });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Couldn’t create the backup.', error: true });
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await pickBackup();
      if (!res) return;
      if (!res.ok) return setMessage({ text: res.error, error: true });
      setPending({ data: res.data, skipped: res.skipped });
    } catch {
      setMessage({ text: 'Couldn’t read that file.', error: true });
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    if (!pending) return;
    importData(pending.data);
    setMessage({ text: pending.skipped ? `Restored. ${pending.skipped} damaged entr${pending.skipped === 1 ? 'y was' : 'ies were'} skipped.` : 'Restored.' });
    setPending(null);
  };

  return (
    <Card>
      <View style={{ gap: 16 }}>
        <Label>Backup</Label>
        {pending ? (
          <View style={{ gap: 14 }}>
            <Text className="text-[15px] leading-[22px] text-ink">
              This backup has {pending.data.expenses.length} expenses, {pending.data.incomes.length} money-in entries and {pending.data.accounts.length} wallets
              {pending.data.profile ? ` for ${pending.data.profile.name}` : ''}. Restoring replaces everything on this phone.
            </Text>
            <View className="flex-row" style={{ gap: 12 }}>
              <Button flex small variant="ghost" label="Cancel" onPress={() => setPending(null)} />
              <Button flex small variant="danger" icon="refresh" label="Replace data" onPress={confirm} />
            </View>
          </View>
        ) : (
          <View className="flex-row" style={{ gap: 12 }}>
            <Button flex small icon="cloud-upload-outline" label="Back up" onPress={backup} disabled={busy} />
            <Button flex small variant="ghost" icon="cloud-download-outline" label="Restore" onPress={restore} disabled={busy} />
          </View>
        )}
        {message ? (
          <Text accessibilityLiveRegion="polite" className={`text-[13px] leading-[19px] ${message.error ? 'text-glow' : 'text-sub'}`}>
            {message.text}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
