import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb, initDb } from './index';
import { Errors } from './errors';
import {
  assertInSet,
  assertNonEmptyString,
  assertNullableString,
  assertOptionalUnixMs,
  assertUnixMs,
  generateId,
  getDayBoundsUtcMs,
  jsonParse,
  jsonSerialize,
  nowMs,
  toSnakeCaseLabel
} from './utils';
import type {
  CreateDoseEventInput,
  CreateMedicationInput,
  DoseEvent,
  DoseStatus,
  Medication,
  Schedule,
  SchedulePayload,
  ScheduleType,
  UpsertUserInput,
  User,
  UpdateMedicationPatch,
  UpdateSchedulePatch,
  WarningTag
} from './types';

const FORM_VALUES = ['pill', 'liquid', 'injection', 'other'] as const;
const SCHEDULE_VALUES = ['fixed_times', 'every_x_hours', 'days_of_week', 'prn'] as const;
const DOSE_STATUS_VALUES = ['due', 'taken', 'skipped', 'missed'] as const;

function mapMedication(row: any): Medication {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    dosage: row.dosage,
    form: row.form,
    instructions: row.instructions,
    doctorContact: row.doctor_contact,
    pharmacyContact: row.pharmacy_contact,
    missedDoseGuidance: row.missed_dose_guidance,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapUser(row: any): User {
  return {
    id: row.id,
    displayName: row.display_name,
    timezone: row.timezone,
    emergencyContact: row.emergency_contact,
    notificationsEnabled: row.notifications_enabled,
    createdAt: row.created_at
  };
}

function mapSchedule(row: any): Schedule {
  return {
    id: row.id,
    medicationId: row.medication_id,
    type: row.type,
    payloadJson: row.payload_json,
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapDoseEvent(row: any): DoseEvent {
  return {
    id: row.id,
    medicationId: row.medication_id,
    scheduleId: row.schedule_id,
    scheduledFor: row.scheduled_for,
    status: row.status,
    takenAt: row.taken_at,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function ensureMedicationExists(db: SQLiteDatabase, medicationId: string): Promise<void> {
  const row = await db.getFirstAsync<{ id: string }>('SELECT id FROM medications WHERE id = ? LIMIT 1;', [medicationId]);
  if (!row) {
    throw Errors.NOT_FOUND();
  }
}

async function ensureScheduleExists(db: SQLiteDatabase, scheduleId: string): Promise<void> {
  const row = await db.getFirstAsync<{ id: string }>('SELECT id FROM schedules WHERE id = ? LIMIT 1;', [scheduleId]);
  if (!row) {
    throw Errors.NOT_FOUND();
  }
}

function validateMedicationInput(input: CreateMedicationInput | UpdateMedicationPatch, partial = false): void {
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'name')) {
    if (input.name !== undefined) {
      assertNonEmptyString(input.name, 'name');
    } else if (!partial) {
      throw Errors.VALIDATION('name is required');
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'form') && input.form != null) {
    assertInSet(input.form, 'form', FORM_VALUES);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'startDate') && input.startDate != null) {
    assertUnixMs(input.startDate, 'startDate');
  }

  if (Object.prototype.hasOwnProperty.call(input, 'endDate') && input.endDate != null) {
    assertUnixMs(input.endDate, 'endDate');
  }

  if (Object.prototype.hasOwnProperty.call(input, 'isActive') && input.isActive != null) {
    if (!(input.isActive === 0 || input.isActive === 1)) {
      throw Errors.VALIDATION('isActive must be 0 or 1');
    }
  }
}

function validateSchedulePayload(type: ScheduleType, payload: SchedulePayload): void {
  if (type === 'fixed_times') {
    const value = payload as { times?: unknown };
    if (!Array.isArray(value.times) || value.times.length === 0 || value.times.some((t) => typeof t !== 'string')) {
      throw Errors.VALIDATION('fixed_times payload requires non-empty times string[]');
    }
    return;
  }

  if (type === 'every_x_hours') {
    const value = payload as { intervalHours?: unknown; startTime?: unknown };
    if (typeof value.intervalHours !== 'number' || value.intervalHours <= 0) {
      throw Errors.VALIDATION('every_x_hours payload requires intervalHours > 0');
    }
    if (typeof value.startTime !== 'string' || value.startTime.length === 0) {
      throw Errors.VALIDATION('every_x_hours payload requires startTime');
    }
    return;
  }

  if (type === 'days_of_week') {
    const value = payload as { days?: unknown; time?: unknown };
    if (!Array.isArray(value.days) || value.days.length === 0 || value.days.some((d) => typeof d !== 'number' || d < 0 || d > 6)) {
      throw Errors.VALIDATION('days_of_week payload requires days number[] with values 0..6');
    }
    if (typeof value.time !== 'string' || value.time.length === 0) {
      throw Errors.VALIDATION('days_of_week payload requires time');
    }
    return;
  }

  if (type === 'prn') {
    return;
  }

  throw Errors.VALIDATION('Unknown schedule type');
}

async function withTransaction<T>(fn: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  await initDb();
  const db = await getDb();
  await db.execAsync('BEGIN;');
  try {
    const result = await fn(db);
    await db.execAsync('COMMIT;');
    return result;
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

export async function upsertPrimaryUser(input: UpsertUserInput): Promise<User> {
  const displayName = assertNullableString(input.displayName, 'displayName');
  const timezone = assertNullableString(input.timezone, 'timezone');
  const emergencyContact = assertNullableString(input.emergencyContact, 'emergencyContact');
  const notificationsEnabled = input.notificationsEnabled === 1 ? 1 : 0;
  const id = input.id ?? 'primary-user';
  const createdAt = nowMs();

  await initDb();
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO users (id, display_name, timezone, emergency_contact, notifications_enabled, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       display_name = excluded.display_name,
       timezone = excluded.timezone,
       emergency_contact = excluded.emergency_contact,
       notifications_enabled = excluded.notifications_enabled;`,
    [id, displayName, timezone, emergencyContact, notificationsEnabled, createdAt]
  );

  const row = await db.getFirstAsync<any>('SELECT * FROM users WHERE id = ? LIMIT 1;', [id]);
  if (!row) {
    throw Errors.NOT_FOUND();
  }
  return mapUser(row);
}

export async function getPrimaryUser(): Promise<User | null> {
  await initDb();
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM users ORDER BY created_at ASC LIMIT 1;');
  return row ? mapUser(row) : null;
}

export async function createMedication(input: CreateMedicationInput): Promise<Medication> {
  validateMedicationInput(input, false);

  const id = generateId();
  const timestamp = nowMs();
  const name = assertNonEmptyString(input.name, 'name');
  const dosage = assertNullableString(input.dosage, 'dosage');
  const form = input.form == null ? null : assertInSet(input.form, 'form', FORM_VALUES);
  const instructions = assertNullableString(input.instructions, 'instructions');
  const doctorContact = assertNullableString(input.doctorContact, 'doctorContact');
  const pharmacyContact = assertNullableString(input.pharmacyContact, 'pharmacyContact');
  const missedDoseGuidance = assertNullableString(input.missedDoseGuidance, 'missedDoseGuidance');
  const startDate = assertOptionalUnixMs(input.startDate, 'startDate');
  const endDate = assertOptionalUnixMs(input.endDate, 'endDate');
  const isActive = input.isActive ?? 1;
  const userId = input.userId ?? null;

  await initDb();
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO medications (id, user_id, name, dosage, form, instructions, doctor_contact, pharmacy_contact, missed_dose_guidance, start_date, end_date, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, userId, name, dosage, form, instructions, doctorContact, pharmacyContact, missedDoseGuidance, startDate, endDate, isActive, timestamp, timestamp]
  );

  const medication = await getMedicationById(id);
  if (!medication) {
    throw Errors.NOT_FOUND();
  }
  return medication;
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  await initDb();
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM medications WHERE id = ? LIMIT 1;', [id]);
  return row ? mapMedication(row) : null;
}

export async function listMedications(activeOnly = false): Promise<Medication[]> {
  await initDb();
  const db = await getDb();
  const sql = activeOnly
    ? 'SELECT * FROM medications WHERE is_active = 1 ORDER BY created_at DESC;'
    : 'SELECT * FROM medications ORDER BY created_at DESC;';

  const rows = await db.getAllAsync<any>(sql);
  return rows.map(mapMedication);
}

export async function updateMedication(id: string, patch: UpdateMedicationPatch): Promise<Medication> {
  validateMedicationInput(patch, true);

  const existing = await getMedicationById(id);
  if (!existing) {
    throw Errors.NOT_FOUND();
  }

  const merged: Medication = {
    ...existing,
    name: patch.name != null ? assertNonEmptyString(patch.name, 'name') : existing.name,
    userId: patch.userId !== undefined ? patch.userId : existing.userId,
    dosage: patch.dosage !== undefined ? assertNullableString(patch.dosage, 'dosage') : existing.dosage,
    form: patch.form !== undefined ? (patch.form == null ? null : assertInSet(patch.form, 'form', FORM_VALUES)) : existing.form,
    instructions: patch.instructions !== undefined ? assertNullableString(patch.instructions, 'instructions') : existing.instructions,
    doctorContact: patch.doctorContact !== undefined ? assertNullableString(patch.doctorContact, 'doctorContact') : existing.doctorContact,
    pharmacyContact: patch.pharmacyContact !== undefined ? assertNullableString(patch.pharmacyContact, 'pharmacyContact') : existing.pharmacyContact,
    missedDoseGuidance:
      patch.missedDoseGuidance !== undefined
        ? assertNullableString(patch.missedDoseGuidance, 'missedDoseGuidance')
        : existing.missedDoseGuidance,
    startDate: patch.startDate !== undefined ? assertOptionalUnixMs(patch.startDate, 'startDate') : existing.startDate,
    endDate: patch.endDate !== undefined ? assertOptionalUnixMs(patch.endDate, 'endDate') : existing.endDate,
    isActive: patch.isActive !== undefined ? patch.isActive : existing.isActive,
    createdAt: existing.createdAt,
    updatedAt: nowMs(),
    id: existing.id
  };

  await initDb();
  const db = await getDb();
  await db.runAsync(
    `UPDATE medications
     SET user_id = ?, name = ?, dosage = ?, form = ?, instructions = ?, doctor_contact = ?, pharmacy_contact = ?, missed_dose_guidance = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = ?
     WHERE id = ?;`,
    [
      merged.userId,
      merged.name,
      merged.dosage,
      merged.form,
      merged.instructions,
      merged.doctorContact,
      merged.pharmacyContact,
      merged.missedDoseGuidance,
      merged.startDate,
      merged.endDate,
      merged.isActive,
      merged.updatedAt,
      id
    ]
  );

  return merged;
}

export async function deactivateMedication(id: string): Promise<void> {
  await updateMedication(id, { isActive: 0 });
}

export async function deleteMedication(id: string): Promise<void> {
  await initDb();
  const db = await getDb();
  const result = await db.runAsync('DELETE FROM medications WHERE id = ?;', [id]);
  if ((result.changes ?? 0) === 0) {
    throw Errors.NOT_FOUND();
  }
}

export async function createSchedule<T extends SchedulePayload>(
  medicationId: string,
  type: ScheduleType,
  payload: T,
  timezone?: string
): Promise<Schedule> {
  assertNonEmptyString(medicationId, 'medicationId');
  assertInSet(type, 'type', SCHEDULE_VALUES);
  validateSchedulePayload(type, payload);

  const id = generateId();
  const timestamp = nowMs();
  const serialized = jsonSerialize(payload);

  await initDb();
  const db = await getDb();
  await ensureMedicationExists(db, medicationId);

  await db.runAsync(
    `INSERT INTO schedules (id, medication_id, type, payload_json, timezone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, medicationId, type, serialized, timezone ?? null, timestamp, timestamp]
  );

  const row = await db.getFirstAsync<any>('SELECT * FROM schedules WHERE id = ? LIMIT 1;', [id]);
  if (!row) {
    throw Errors.NOT_FOUND();
  }
  return mapSchedule(row);
}

export async function listSchedulesForMedication(medicationId: string): Promise<Schedule[]> {
  await initDb();
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM schedules WHERE medication_id = ? ORDER BY created_at ASC;', [medicationId]);
  return rows.map(mapSchedule);
}

export async function updateSchedule<T extends SchedulePayload>(id: string, patch: UpdateSchedulePatch<T>): Promise<Schedule> {
  await initDb();
  const db = await getDb();
  const existingRow = await db.getFirstAsync<any>('SELECT * FROM schedules WHERE id = ? LIMIT 1;', [id]);
  if (!existingRow) {
    throw Errors.NOT_FOUND();
  }
  const existing = mapSchedule(existingRow);

  const nextType = patch.type ? assertInSet(patch.type, 'type', SCHEDULE_VALUES) : existing.type;
  const nextPayload = patch.payload ? patch.payload : jsonParse<SchedulePayload>(existing.payloadJson);

  validateSchedulePayload(nextType, nextPayload);

  const updatedAt = nowMs();
  const payloadJson = jsonSerialize(nextPayload);
  const timezone = patch.timezone !== undefined ? patch.timezone : existing.timezone;

  await db.runAsync(
    'UPDATE schedules SET type = ?, payload_json = ?, timezone = ?, updated_at = ? WHERE id = ?;',
    [nextType, payloadJson, timezone ?? null, updatedAt, id]
  );

  return {
    ...existing,
    type: nextType,
    payloadJson,
    timezone: timezone ?? null,
    updatedAt
  };
}

export async function deleteSchedule(id: string): Promise<void> {
  await initDb();
  const db = await getDb();
  const result = await db.runAsync('DELETE FROM schedules WHERE id = ?;', [id]);
  if ((result.changes ?? 0) === 0) {
    throw Errors.NOT_FOUND();
  }
}

export async function upsertWarningTag(label: string): Promise<WarningTag> {
  const normalized = toSnakeCaseLabel(assertNonEmptyString(label, 'label'));
  const id = generateId();

  await initDb();
  const db = await getDb();
  await db.runAsync('INSERT INTO warning_tags (id, label) VALUES (?, ?) ON CONFLICT(label) DO NOTHING;', [id, normalized]);

  const row = await db.getFirstAsync<any>('SELECT * FROM warning_tags WHERE label = ? LIMIT 1;', [normalized]);
  if (!row) {
    throw Errors.NOT_FOUND();
  }
  return { id: row.id, label: row.label };
}

export async function setMedicationWarningTags(medicationId: string, labels: string[]): Promise<void> {
  if (!Array.isArray(labels)) {
    throw Errors.VALIDATION('labels must be a string[]');
  }

  await withTransaction(async (db) => {
    await ensureMedicationExists(db, medicationId);

    await db.runAsync('DELETE FROM medication_warning_tags WHERE medication_id = ?;', [medicationId]);

    for (const rawLabel of labels) {
      const normalized = toSnakeCaseLabel(assertNonEmptyString(rawLabel, 'label'));
      const tagId = generateId();
      await db.runAsync('INSERT INTO warning_tags (id, label) VALUES (?, ?) ON CONFLICT(label) DO NOTHING;', [tagId, normalized]);
      const tag = await db.getFirstAsync<{ id: string }>('SELECT id FROM warning_tags WHERE label = ? LIMIT 1;', [normalized]);
      if (!tag) {
        throw Errors.NOT_FOUND();
      }
      await db.runAsync(
        'INSERT INTO medication_warning_tags (medication_id, warning_tag_id) VALUES (?, ?) ON CONFLICT(medication_id, warning_tag_id) DO NOTHING;',
        [medicationId, tag.id]
      );
    }
  });
}

export async function getMedicationWarningTags(medicationId: string): Promise<string[]> {
  await initDb();
  const db = await getDb();
  const rows = await db.getAllAsync<{ label: string }>(
    `SELECT wt.label
     FROM warning_tags wt
     JOIN medication_warning_tags mwt ON wt.id = mwt.warning_tag_id
     WHERE mwt.medication_id = ?
     ORDER BY wt.label ASC;`,
    [medicationId]
  );
  return rows.map((row) => row.label);
}

export async function createDoseEvent(input: CreateDoseEventInput): Promise<DoseEvent> {
  const medicationId = assertNonEmptyString(input.medicationId, 'medicationId');
  const scheduleId = input.scheduleId ?? null;
  const scheduledFor = assertUnixMs(input.scheduledFor, 'scheduledFor');
  const status = input.status ? assertInSet(input.status, 'status', DOSE_STATUS_VALUES) : 'due';
  const takenAt = input.takenAt == null ? null : assertUnixMs(input.takenAt, 'takenAt');
  const note = assertNullableString(input.note, 'note');

  const id = generateId();
  const timestamp = nowMs();

  await initDb();
  const db = await getDb();
  await ensureMedicationExists(db, medicationId);
  if (scheduleId) {
    await ensureScheduleExists(db, scheduleId);
  }

  await db.runAsync(
    `INSERT INTO dose_events (id, medication_id, schedule_id, scheduled_for, status, taken_at, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, medicationId, scheduleId, scheduledFor, status, takenAt, note, timestamp, timestamp]
  );

  const row = await db.getFirstAsync<any>('SELECT * FROM dose_events WHERE id = ? LIMIT 1;', [id]);
  if (!row) {
    throw Errors.NOT_FOUND();
  }
  return mapDoseEvent(row);
}

export async function listDoseEventsForDay(dateISO: string, timezone: string): Promise<DoseEvent[]> {
  const tz = assertNonEmptyString(timezone, 'timezone');
  const { startMs, endMs } = getDayBoundsUtcMs(dateISO, tz);

  await initDb();
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM dose_events
     WHERE scheduled_for >= ? AND scheduled_for < ?
     ORDER BY scheduled_for ASC;`,
    [startMs, endMs]
  );

  return rows.map(mapDoseEvent);
}

export async function listDoseEventsForMedication(medicationId: string, limit = 50, offset = 0): Promise<DoseEvent[]> {
  const medId = assertNonEmptyString(medicationId, 'medicationId');
  const safeLimit = Math.max(1, Math.floor(limit));
  const safeOffset = Math.max(0, Math.floor(offset));

  await initDb();
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM dose_events
     WHERE medication_id = ?
     ORDER BY scheduled_for DESC
     LIMIT ? OFFSET ?;`,
    [medId, safeLimit, safeOffset]
  );

  return rows.map(mapDoseEvent);
}

async function updateDoseStatus(
  doseEventId: string,
  status: DoseStatus,
  fields: { takenAt?: number | null; note?: string | null } = {}
): Promise<void> {
  assertNonEmptyString(doseEventId, 'doseEventId');
  assertInSet(status, 'status', DOSE_STATUS_VALUES);

  await initDb();
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM dose_events WHERE id = ? LIMIT 1;', [doseEventId]);
  if (!existing) {
    throw Errors.NOT_FOUND();
  }

  const updatedAt = nowMs();
  await db.runAsync(
    `UPDATE dose_events
     SET status = ?, taken_at = ?, note = COALESCE(?, note), updated_at = ?
     WHERE id = ?;`,
    [status, fields.takenAt ?? null, fields.note ?? null, updatedAt, doseEventId]
  );
}

export async function markDoseTaken(doseEventId: string, takenAtMs: number): Promise<void> {
  await updateDoseStatus(doseEventId, 'taken', { takenAt: assertUnixMs(takenAtMs, 'takenAtMs') });
}

export async function markDoseSkipped(doseEventId: string, note?: string): Promise<void> {
  await updateDoseStatus(doseEventId, 'skipped', { note: note ? assertNonEmptyString(note, 'note') : null });
}

export async function markDoseMissed(doseEventId: string): Promise<void> {
  await updateDoseStatus(doseEventId, 'missed');
}

export async function seedDemoDataImpl(): Promise<void> {
  await withTransaction(async (db) => {
    const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM medications;');
    if ((existing?.count ?? 0) > 0) {
      return;
    }

    const med1 = await createMedication({
      name: 'Lisinopril',
      dosage: '10 mg',
      form: 'pill',
      instructions: 'Take with water.',
      startDate: nowMs()
    });

    const med2 = await createMedication({
      name: 'Metformin',
      dosage: '500 mg',
      form: 'pill',
      instructions: 'Take with food.',
      startDate: nowMs()
    });

    const med3 = await createMedication({
      name: 'Albuterol',
      dosage: '2 puffs',
      form: 'other',
      instructions: 'Use as needed.',
      startDate: nowMs()
    });

    const sch1 = await createSchedule(med1.id, 'fixed_times', { times: ['09:00'] }, Intl.DateTimeFormat().resolvedOptions().timeZone);
    const sch2 = await createSchedule(med2.id, 'fixed_times', { times: ['08:00', '20:00'] }, Intl.DateTimeFormat().resolvedOptions().timeZone);
    const sch3 = await createSchedule(med3.id, 'prn', { notes: 'as needed' }, Intl.DateTimeFormat().resolvedOptions().timeZone);

    const ensureTag = async (label: string): Promise<string> => {
      const normalized = toSnakeCaseLabel(label);
      const tagId = generateId();
      await db.runAsync('INSERT INTO warning_tags (id, label) VALUES (?, ?) ON CONFLICT(label) DO NOTHING;', [tagId, normalized]);
      const row = await db.getFirstAsync<{ id: string }>('SELECT id FROM warning_tags WHERE label = ? LIMIT 1;', [normalized]);
      if (!row) {
        throw Errors.NOT_FOUND();
      }
      return row.id;
    };

    const linkTag = async (medicationId: string, label: string): Promise<void> => {
      const warningTagId = await ensureTag(label);
      await db.runAsync(
        'INSERT INTO medication_warning_tags (medication_id, warning_tag_id) VALUES (?, ?) ON CONFLICT(medication_id, warning_tag_id) DO NOTHING;',
        [medicationId, warningTagId]
      );
    };

    await linkTag(med1.id, 'take_with_water');
    await linkTag(med2.id, 'with_food');
    await linkTag(med3.id, 'may_cause_drowsiness');

    const now = nowMs();
    const oneHour = 60 * 60 * 1000;

    await createDoseEvent({ medicationId: med1.id, scheduleId: sch1.id, scheduledFor: now - 3 * oneHour, status: 'taken', takenAt: now - 2 * oneHour });
    await createDoseEvent({ medicationId: med2.id, scheduleId: sch2.id, scheduledFor: now - oneHour, status: 'skipped', note: 'Felt nauseous' });
    await createDoseEvent({ medicationId: med2.id, scheduleId: sch2.id, scheduledFor: now + oneHour, status: 'due' });
    await createDoseEvent({ medicationId: med3.id, scheduleId: sch3.id, scheduledFor: now + 2 * oneHour, status: 'due' });
  });
}

export function decodeSchedulePayload<T extends SchedulePayload>(schedule: Schedule): T {
  return jsonParse<T>(schedule.payloadJson);
}

export async function createReminder(date: string, time: string, text: string, userId?: string | null): Promise<{ id: string; date: string; time: string; text: string }> {
  await initDb();
  const db = await getDb();
  
  const id = generateId();
  const timestamp = nowMs();
  
  await db.runAsync(
    `INSERT INTO reminders (id, user_id, date, time, text, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, userId ?? null, date, time, text, timestamp, timestamp]
  );
  
  return { id, date, time, text };
}

export async function listRemindersByDate(date: string): Promise<Array<{ id: string; date: string; time: string; text: string }>> {
  await initDb();
  const db = await getDb();
  
  const rows = await db.getAllAsync<any>(
    `SELECT id, date, time, text FROM reminders WHERE date = ? ORDER BY time ASC;`,
    [date]
  );
  
  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    time: row.time,
    text: row.text
  }));
}

export async function deleteReminder(id: string): Promise<void> {
  await initDb();
  const db = await getDb();
  
  await db.runAsync('DELETE FROM reminders WHERE id = ?;', [id]);
}

export async function listAllReminders(): Promise<Record<string, Array<{ id: string; time: string; text: string }>>> {
  await initDb();
  const db = await getDb();
  
  const rows = await db.getAllAsync<any>(
    `SELECT id, date, time, text FROM reminders ORDER BY date DESC, time ASC;`
  );
  
  const result: Record<string, Array<{ id: string; time: string; text: string }>> = {};
  
  for (const row of rows) {
    if (!result[row.date]) {
      result[row.date] = [];
    }
    result[row.date].push({
      id: row.id,
      time: row.time,
      text: row.text
    });
  }
  
  return result;
}

