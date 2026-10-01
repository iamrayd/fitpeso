import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { SCHEMA, parseBackup, type BackupFile, type ParseResult } from './backup-validate';
import { dateKey } from './date';
import { initial, useStore, type AppData } from './store';

function currentData(): AppData {
  const s = useStore.getState();
  return Object.fromEntries(Object.keys(initial).map((k) => [k, s[k as keyof AppData]])) as AppData;
}

/** Writes a backup file and opens the share sheet (Drive, Messenger, Files…). */
export async function exportBackup(): Promise<void> {
  const backup: BackupFile = { app: 'fitpeso', schema: SCHEMA, exportedAt: new Date().toISOString(), data: currentData() };
  const file = new File(Paths.cache, `fitpeso-backup-${dateKey()}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup));
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing isn’t available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save FitPeso backup' });
}

/** Lets you pick a backup file and validates it. Returns null if you cancel. Nothing is changed yet. */
export async function pickBackup(): Promise<ParseResult | null> {
  // Many Android file managers don't label .json files correctly, so accept any file and validate it ourselves.
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const text = await new File(res.assets[0].uri).text();
  return parseBackup(text, initial);
}
