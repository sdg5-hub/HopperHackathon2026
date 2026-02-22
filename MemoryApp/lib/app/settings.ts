import { getDb, initDb } from '@/lib/db';

const ONBOARDING_KEY = 'onboarding_completed';
const DEMO_MODE_KEY = 'demo_mode_enabled';
const SAFETY_ACK_KEY = 'safety_check_ack';
const SAFETY_RESHOW_KEY = 'safety_check_reshow_on_launch';

async function ensureSettingsTable(): Promise<void> {
  await initDb();
  const db = await getDb();
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );`
  );
}

async function getSetting(key: string): Promise<string | null> {
  await ensureSettingsTable();
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [key]);
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  await ensureSettingsTable();
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [key, value, Date.now()]
  );
}

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await getSetting(ONBOARDING_KEY);
  return value === '1';
}

export async function setOnboardingComplete(completed: boolean): Promise<void> {
  await setSetting(ONBOARDING_KEY, completed ? '1' : '0');
}

export async function isDemoModeEnabled(): Promise<boolean> {
  const value = await getSetting(DEMO_MODE_KEY);
  return value === '1';
}

export async function setDemoModeEnabled(enabled: boolean): Promise<void> {
  await setSetting(DEMO_MODE_KEY, enabled ? '1' : '0');
}

export async function isSafetyAcknowledged(): Promise<boolean> {
  const value = await getSetting(SAFETY_ACK_KEY);
  return value === '1';
}

export async function setSafetyAcknowledged(accepted: boolean): Promise<void> {
  await setSetting(SAFETY_ACK_KEY, accepted ? '1' : '0');
}

export async function shouldReshowSafetyOnLaunch(): Promise<boolean> {
  const value = await getSetting(SAFETY_RESHOW_KEY);
  return value === '1';
}

export async function setReshowSafetyOnLaunch(enabled: boolean): Promise<void> {
  await setSetting(SAFETY_RESHOW_KEY, enabled ? '1' : '0');
}
