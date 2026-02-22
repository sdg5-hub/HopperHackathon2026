import { getDb, initDb } from '@/lib/db';
import { decodeSchedulePayload, getMedicationById, getMedicationWarningTags, listDoseEventsForMedication, listMedications, listSchedulesForMedication } from '@/lib/db/queries';
import type { DoseEvent, Medication, Schedule, SchedulePayload } from '@/lib/db/types';

export type MedWithMeta = {
  medication: Medication;
  warningTags: string[];
  nextDose: DoseEvent | null;
};

export type DoseRow = {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string | null;
  scheduledFor: number;
  takenAt: number | null;
  status: DoseEvent['status'];
};

export async function listMedicationsWithMeta(): Promise<MedWithMeta[]> {
  const meds = await listMedications(false);
  const active = meds.filter((med) => med.isActive === 1);
  const inactive = meds.filter((med) => med.isActive === 0);
  const ordered = [...active, ...inactive];

  const items: MedWithMeta[] = [];
  for (const med of ordered) {
    const tags = await getMedicationWarningTags(med.id);
    const events = await listDoseEventsForMedication(med.id, 200, 0);
    const nextDose =
      events
        .filter((event) => event.status === 'due' && event.scheduledFor >= Date.now())
        .sort((a, b) => a.scheduledFor - b.scheduledFor)[0] ?? null;

    items.push({ medication: med, warningTags: tags, nextDose });
  }

  return items;
}

export async function getMedicationDetail(medicationId: string): Promise<{
  medication: Medication;
  schedules: Schedule[];
  warningTags: string[];
  upcomingDoses: DoseEvent[];
}> {
  const medication = await getMedicationById(medicationId);
  if (!medication) {
    throw new Error('NOT_FOUND');
  }

  const schedules = await listSchedulesForMedication(medicationId);
  const warningTags = await getMedicationWarningTags(medicationId);
  const upcomingDoses = (await listDoseEventsForMedication(medicationId, 200, 0))
    .filter((event) => event.status === 'due' && event.scheduledFor >= Date.now())
    .sort((a, b) => a.scheduledFor - b.scheduledFor)
    .slice(0, 3);

  return {
    medication,
    schedules,
    warningTags,
    upcomingDoses
  };
}

export async function listTodayDoseRows(): Promise<DoseRow[]> {
  await initDb();
  const db = await getDb();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const end = start + 24 * 60 * 60 * 1000;

  const rows = await db.getAllAsync<any>(
    `SELECT de.id, de.medication_id, de.scheduled_for, de.taken_at, de.status, m.name as medication_name, m.dosage
     FROM dose_events de
     JOIN medications m ON m.id = de.medication_id
     WHERE de.scheduled_for >= ? AND de.scheduled_for < ?
     ORDER BY de.scheduled_for ASC;`,
    [start, end]
  );

  return rows.map((row) => ({
    id: row.id,
    medicationId: row.medication_id,
    medicationName: row.medication_name,
    dosage: row.dosage,
    scheduledFor: row.scheduled_for,
    takenAt: row.taken_at,
    status: row.status
  }));
}

export async function listHistoryDoseRows(filterMedicationId?: string): Promise<DoseRow[]> {
  await initDb();
  const db = await getDb();
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const whereMedication = filterMedicationId ? 'AND de.medication_id = ?' : '';
  const params: any[] = [now - sevenDaysMs, now];
  if (filterMedicationId) params.push(filterMedicationId);

  const rows = await db.getAllAsync<any>(
    `SELECT de.id, de.medication_id, de.scheduled_for, de.taken_at, de.status, m.name as medication_name, m.dosage
     FROM dose_events de
     JOIN medications m ON m.id = de.medication_id
     WHERE de.scheduled_for BETWEEN ? AND ? ${whereMedication}
     ORDER BY de.scheduled_for DESC;`,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    medicationId: row.medication_id,
    medicationName: row.medication_name,
    dosage: row.dosage,
    scheduledFor: row.scheduled_for,
    takenAt: row.taken_at,
    status: row.status
  }));
}

export function describeSchedule(schedule: Schedule): string {
  try {
    const payload = decodeSchedulePayload<SchedulePayload>(schedule);
    if (schedule.type === 'fixed_times') {
      return `Daily at ${(payload as any).times.join(', ')}`;
    }
    if (schedule.type === 'every_x_hours') {
      const p = payload as any;
      return `Every ${p.intervalHours}h from ${p.startTime}`;
    }
    if (schedule.type === 'days_of_week') {
      const p = payload as any;
      return `Days ${p.days.join(', ')} at ${p.time}`;
    }
    return 'As needed (PRN)';
  } catch {
    return 'Schedule unavailable';
  }
}
