import * as Notifications from 'expo-notifications';
import { getDb, initDb } from '@/lib/db';
import type { AutoMissWindow } from '@/lib/app/constants';
import { AUTO_MISS_WINDOW_MS } from '@/lib/app/constants';
import type { RxNotificationDbAdapter } from './types';

const AUTO_MISS_KEY = 'auto_miss_window';

export async function getAutoMissWindow(): Promise<AutoMissWindow> {
  await initDb();
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [AUTO_MISS_KEY]);
  const value = row?.value as AutoMissWindow | undefined;
  if (!value) return '2h';
  if (value === '1h' || value === '2h' || value === '4h' || value === 'never') return value;
  return '2h';
}

export async function setAutoMissWindow(value: AutoMissWindow): Promise<void> {
  await initDb();
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [AUTO_MISS_KEY, value, Date.now()]
  );
}

export async function runReliabilitySweep(dbAdapter: RxNotificationDbAdapter, nowMs = Date.now()): Promise<number> {
  const windowSetting = await getAutoMissWindow();
  if (windowSetting === 'never') return 0;
  const threshold = AUTO_MISS_WINDOW_MS[windowSetting];

  const due = await dbAdapter.listDueDoseEvents(nowMs);
  let changed = 0;

  for (const dose of due) {
    if (nowMs > dose.scheduled_for + threshold) {
      await dbAdapter.markDoseMissed(dose.id);

      const links = await dbAdapter.listNotificationLinksForMedication(dose.medication_id);
      const related = links.filter((link) => link.dose_event_id === dose.id);
      for (const link of related) {
        try {
          await Notifications.cancelScheduledNotificationAsync(link.notification_identifier);
        } catch {
          // noop
        }
        await dbAdapter.deleteNotificationLinkByIdentifier(link.notification_identifier);
      }

      changed += 1;
      if (__DEV__) {
        console.log('[reliability] auto-marked missed', dose.id);
      }
    }
  }

  return changed;
}
