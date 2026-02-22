import { getDb, initDb } from '@/lib/db';
import { createDoseEvent, getMedicationById, listDoseEventsForMedication, listMedications, listSchedulesForMedication, markDoseMissed, markDoseSkipped, markDoseTaken } from '@/lib/db/queries';
import { generateId, jsonParse } from '@/lib/db/utils';
import type { DaysOfWeekPayload, DoseEvent as DbDoseEvent, EveryXHoursPayload, FixedTimesPayload, SchedulePayload, ScheduleType } from '@/lib/db/types';
import type { DoseEvent, Medication, NotificationLink, RxNotificationDbAdapter, Schedule } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

function getZonedParts(ms: number, tz: string): { year: number; month: number; day: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });
  const parts = fmt.formatToParts(new Date(ms));
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    weekday: map[read('weekday')] ?? 0
  };
}

function getOffsetMsForTimeZone(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(read('year'), read('month') - 1, read('day'), read('hour'), read('minute'), read('second'));
  return asUtc - date.getTime();
}

function zonedDateTimeToUtcMs(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const offset1 = getOffsetMsForTimeZone(new Date(guess), timeZone);
  let ts = guess - offset1;
  const offset2 = getOffsetMsForTimeZone(new Date(ts), timeZone);
  if (offset1 !== offset2) ts = guess - offset2;
  return ts;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: Number.isFinite(h) ? h : 0, minute: Number.isFinite(m) ? m : 0 };
}

function mapSchedule(schedule: any): Schedule {
  return {
    id: schedule.id,
    medication_id: schedule.medicationId,
    type: schedule.type,
    payload_json: schedule.payloadJson,
    timezone: schedule.timezone ?? undefined
  };
}

function mapDoseEvent(event: DbDoseEvent): DoseEvent {
  return {
    id: event.id,
    medication_id: event.medicationId,
    schedule_id: event.scheduleId,
    scheduled_for: event.scheduledFor,
    status: event.status,
    taken_at: event.takenAt,
    note: event.note
  };
}

async function getExistingDoseEvent(medicationId: string, scheduleId: string | null, scheduledFor: number): Promise<DbDoseEvent | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM dose_events
     WHERE medication_id = ?
     AND COALESCE(schedule_id, '') = COALESCE(?, '')
     AND scheduled_for = ?
     LIMIT 1;`,
    [medicationId, scheduleId, scheduledFor]
  );
  if (!row) return null;

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

function scheduleTimesForDay(type: ScheduleType, payload: SchedulePayload, weekday: number): Array<{ hour: number; minute: number }> {
  if (type === 'prn') return [];
  if (type === 'fixed_times') {
    return (payload as FixedTimesPayload).times.map(parseTime);
  }
  if (type === 'days_of_week') {
    const typed = payload as DaysOfWeekPayload;
    if (!typed.days.includes(weekday)) return [];
    return [parseTime(typed.time)];
  }
  const typed = payload as EveryXHoursPayload;
  const start = parseTime(typed.startTime);
  const rows: Array<{ hour: number; minute: number }> = [];
  for (let hour = start.hour; hour < 24; hour += typed.intervalHours) {
    rows.push({ hour, minute: start.minute });
  }
  return rows;
}

export class SqliteNotificationAdapter implements RxNotificationDbAdapter {
  async getActiveMedications(): Promise<Medication[]> {
    const meds = await listMedications(true);
    return meds.map((med) => ({
      id: med.id,
      name: med.name,
      dosage: med.dosage ?? undefined,
      instructions: med.instructions ?? undefined,
      is_active: med.isActive === 1
    }));
  }

  async getSchedulesForMedication(medId: string): Promise<Schedule[]> {
    const schedules = await listSchedulesForMedication(medId);
    return schedules.map(mapSchedule);
  }

  async upsertDoseEventsForWindow(medId: string, fromMs: number, toMs: number): Promise<DoseEvent[]> {
    await initDb();
    const schedules = await listSchedulesForMedication(medId);
    const results: DoseEvent[] = [];

    for (const schedule of schedules) {
      if (schedule.type === 'prn') continue;

      const tz = schedule.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      const payload = jsonParse<SchedulePayload>(schedule.payloadJson);
      const visited = new Set<string>();

      for (let cursor = fromMs; cursor <= toMs; cursor += DAY_MS) {
        const day = getZonedParts(cursor, tz);
        const dayKey = `${day.year}-${day.month}-${day.day}`;
        if (visited.has(dayKey)) continue;
        visited.add(dayKey);

        const times = scheduleTimesForDay(schedule.type, payload, day.weekday);
        for (const time of times) {
          const scheduledFor = zonedDateTimeToUtcMs(day.year, day.month, day.day, time.hour, time.minute, tz);
          if (scheduledFor < fromMs || scheduledFor > toMs) continue;

          const existing = await getExistingDoseEvent(medId, schedule.id, scheduledFor);
          if (existing) {
            results.push(mapDoseEvent(existing));
            continue;
          }

          const created = await createDoseEvent({
            medicationId: medId,
            scheduleId: schedule.id,
            scheduledFor,
            status: 'due'
          });

          results.push(mapDoseEvent(created));
        }
      }
    }

    results.sort((a, b) => a.scheduled_for - b.scheduled_for);
    return results;
  }

  async listDueDoseEvents(nowMs: number): Promise<DoseEvent[]> {
    await initDb();
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM dose_events
       WHERE status = 'due' AND scheduled_for <= ?
       ORDER BY scheduled_for ASC;`,
      [nowMs]
    );

    return rows.map((row) => ({
      id: row.id,
      medication_id: row.medication_id,
      schedule_id: row.schedule_id,
      scheduled_for: row.scheduled_for,
      status: row.status,
      taken_at: row.taken_at,
      note: row.note
    }));
  }

  async markDoseTaken(doseEventId: string, takenAtMs: number): Promise<void> {
    await markDoseTaken(doseEventId, takenAtMs);
  }

  async markDoseSkipped(doseEventId: string, note?: string): Promise<void> {
    await markDoseSkipped(doseEventId, note);
  }

  async markDoseMissed(doseEventId: string): Promise<void> {
    await markDoseMissed(doseEventId);
  }

  async saveNotificationLink(link: NotificationLink): Promise<void> {
    await initDb();
    const db = await getDb();
    await db.runAsync(
      `INSERT OR IGNORE INTO notification_links
      (id, dose_event_id, medication_id, schedule_id, notification_identifier, trigger_at, kind, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        link.id || generateId(),
        link.dose_event_id,
        link.medication_id,
        link.schedule_id ?? null,
        link.notification_identifier,
        link.trigger_at,
        link.kind,
        link.created_at
      ]
    );
  }

  async listNotificationLinksForMedication(medId: string): Promise<NotificationLink[]> {
    await initDb();
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM notification_links WHERE medication_id = ? ORDER BY trigger_at ASC;', [medId]);
    return rows.map((row) => ({
      id: row.id,
      dose_event_id: row.dose_event_id,
      medication_id: row.medication_id,
      schedule_id: row.schedule_id,
      notification_identifier: row.notification_identifier,
      trigger_at: row.trigger_at,
      kind: row.kind,
      created_at: row.created_at
    }));
  }

  async deleteNotificationLinkByIdentifier(identifier: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM notification_links WHERE notification_identifier = ?;', [identifier]);
  }

  async deleteAllNotificationLinksForMedication(medId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM notification_links WHERE medication_id = ?;', [medId]);
  }

  async deleteNotificationLinksForDoseEvent(doseEventId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM notification_links WHERE dose_event_id = ?;', [doseEventId]);
  }

  async getMedication(medicationId: string): Promise<Medication | null> {
    const med = await getMedicationById(medicationId);
    if (!med) return null;
    return {
      id: med.id,
      name: med.name,
      dosage: med.dosage ?? undefined,
      instructions: med.instructions ?? undefined,
      is_active: med.isActive === 1
    };
  }

  async listDoseEventsForMedication(medicationId: string, limit = 100): Promise<DoseEvent[]> {
    const events = await listDoseEventsForMedication(medicationId, limit, 0);
    return events.map(mapDoseEvent);
  }
}

let singleton: SqliteNotificationAdapter | null = null;

export function getNotificationDbAdapter(): SqliteNotificationAdapter {
  if (!singleton) {
    singleton = new SqliteNotificationAdapter();
  }
  return singleton;
}
