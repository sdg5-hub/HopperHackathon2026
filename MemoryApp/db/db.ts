import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

const DB_NAME = 'rxshield.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await runMigrations(db);
      return db;
    })();
  }
  return dbPromise;
}

export async function resetDbForDev(): Promise<void> {
  const db = await getDb();
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  await db.execAsync('DROP TABLE IF EXISTS dose_events;');
  await db.execAsync('DROP TABLE IF EXISTS medication_warning_tags;');
  await db.execAsync('DROP TABLE IF EXISTS warning_tags;');
  await db.execAsync('DROP TABLE IF EXISTS schedules;');
  await db.execAsync('DROP TABLE IF EXISTS medications;');
  await db.execAsync('DROP TABLE IF EXISTS users;');
  await db.execAsync('PRAGMA user_version = 0;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
}

export async function seedDemoData(): Promise<void> {
  const { seedDemoDataImpl } = await import('./queries');
  await seedDemoDataImpl();
}
