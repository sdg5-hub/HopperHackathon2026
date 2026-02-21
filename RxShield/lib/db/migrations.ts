import type { SQLiteDatabase } from 'expo-sqlite';

export const SCHEMA_VERSION = 1;

type Migration = {
  version: number;
  statements: string[];
};

export const migrations: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        display_name TEXT,
        created_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        dosage TEXT,
        form TEXT,
        instructions TEXT,
        start_date INTEGER,
        end_date INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );`,
      `CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        medication_id TEXT NOT NULL,
        type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        timezone TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS warning_tags (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL UNIQUE
      );`,
      `CREATE TABLE IF NOT EXISTS medication_warning_tags (
        medication_id TEXT NOT NULL,
        warning_tag_id TEXT NOT NULL,
        PRIMARY KEY (medication_id, warning_tag_id),
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        FOREIGN KEY (warning_tag_id) REFERENCES warning_tags(id) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS dose_events (
        id TEXT PRIMARY KEY,
        medication_id TEXT NOT NULL,
        schedule_id TEXT,
        scheduled_for INTEGER NOT NULL,
        status TEXT NOT NULL,
        taken_at INTEGER,
        note TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_dose_events_medication_scheduled_for
        ON dose_events (medication_id, scheduled_for);`,
      `CREATE INDEX IF NOT EXISTS idx_dose_events_status_scheduled_for
        ON dose_events (status, scheduled_for);`
    ]
  }
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = row?.user_version ?? 0;

  const pending = migrations
    .filter((migration) => migration.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    return;
  }

  await db.execAsync('BEGIN;');
  try {
    for (const migration of pending) {
      for (const statement of migration.statements) {
        await db.execAsync(statement);
      }
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
    }
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}
