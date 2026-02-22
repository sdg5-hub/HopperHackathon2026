import { getDb, initDb } from '@/lib/db';
import { generateId, nowMs } from '@/lib/db/utils';
import { resyncAllSchedules } from '@/lib/notifications/engine';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';

const dbAdapter = getNotificationDbAdapter();

export async function loadDemoDataAndNearReminder(): Promise<void> {
  await initDb();
  const db = await getDb();

  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM medications WHERE is_demo = 1;');
  if ((existing?.count ?? 0) > 0) {
    await resyncAllSchedules(dbAdapter);
    return;
  }

  const ts = nowMs();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const medA = generateId();
  const medB = generateId();
  const medC = generateId();
  const schA = generateId();
  const schB = generateId();
  const schC = generateId();

  await db.execAsync('BEGIN;');
  try {
    await db.runAsync(
      `INSERT INTO medications (id, user_id, name, dosage, form, instructions, start_date, end_date, is_active, is_demo, created_at, updated_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, NULL, 1, 1, ?, ?);`,
      [medA, 'Lisinopril', '10 mg', 'pill', 'Take with water.', ts, ts, ts]
    );
    await db.runAsync(
      `INSERT INTO medications (id, user_id, name, dosage, form, instructions, start_date, end_date, is_active, is_demo, created_at, updated_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, NULL, 1, 1, ?, ?);`,
      [medB, 'Metformin', '500 mg', 'pill', 'Take with food.', ts, ts, ts]
    );
    await db.runAsync(
      `INSERT INTO medications (id, user_id, name, dosage, form, instructions, start_date, end_date, is_active, is_demo, created_at, updated_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, NULL, 1, 1, ?, ?);`,
      [medC, 'Albuterol', '2 puffs', 'other', 'Use as needed.', ts, ts, ts]
    );

    await db.runAsync(
      `INSERT INTO schedules (id, medication_id, type, payload_json, timezone, is_demo, created_at, updated_at)
       VALUES (?, ?, 'fixed_times', ?, ?, 1, ?, ?);`,
      [schA, medA, JSON.stringify({ times: ['09:00', '21:00'] }), tz, ts, ts]
    );
    await db.runAsync(
      `INSERT INTO schedules (id, medication_id, type, payload_json, timezone, is_demo, created_at, updated_at)
       VALUES (?, ?, 'every_x_hours', ?, ?, 1, ?, ?);`,
      [schB, medB, JSON.stringify({ intervalHours: 12, startTime: '08:00' }), tz, ts, ts]
    );
    await db.runAsync(
      `INSERT INTO schedules (id, medication_id, type, payload_json, timezone, is_demo, created_at, updated_at)
       VALUES (?, ?, 'prn', ?, ?, 1, ?, ?);`,
      [schC, medC, JSON.stringify({ notes: 'as needed' }), tz, ts, ts]
    );

    const inFourMin = ts + 4 * 60 * 1000;
    await db.runAsync(
      `INSERT INTO dose_events (id, medication_id, schedule_id, scheduled_for, status, taken_at, note, is_demo, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'due', NULL, NULL, 1, ?, ?);`,
      [generateId(), medA, schA, inFourMin, ts, ts]
    );

    await db.runAsync(
      `INSERT INTO dose_events (id, medication_id, schedule_id, scheduled_for, status, taken_at, note, is_demo, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'taken', ?, NULL, 1, ?, ?);`,
      [generateId(), medB, schB, ts - 2 * 60 * 60 * 1000, ts - 2 * 60 * 60 * 1000 + 10 * 60 * 1000, ts, ts]
    );

    await db.runAsync(
      `INSERT INTO dose_events (id, medication_id, schedule_id, scheduled_for, status, taken_at, note, is_demo, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'missed', NULL, 'missed in demo', 1, ?, ?);`,
      [generateId(), medA, schA, ts - 24 * 60 * 60 * 1000, ts, ts]
    );

    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }

  await resyncAllSchedules(dbAdapter);
}

export async function clearDemoDataOnly(): Promise<void> {
  await initDb();
  const db = await getDb();
  await db.execAsync('BEGIN;');
  try {
    await db.runAsync('DELETE FROM dose_events WHERE is_demo = 1;');
    await db.runAsync('DELETE FROM schedules WHERE is_demo = 1;');
    await db.runAsync('DELETE FROM medications WHERE is_demo = 1;');
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}
