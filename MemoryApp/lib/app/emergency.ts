import { getDb, initDb } from '@/lib/db';
import { listMedications, listSchedulesForMedication } from '@/lib/db/queries';
import { decodeSchedulePayload } from '@/lib/db/queries';
import type { SchedulePayload } from '@/lib/db/types';

const KEYS = {
  name: 'emergency_name',
  allergies: 'emergency_allergies',
  conditions: 'emergency_conditions',
  contactName: 'emergency_contact_name',
  contactPhone: 'emergency_contact_phone'
} as const;

export type EmergencyInfo = {
  name: string;
  allergies: string;
  conditions: string;
  contactName: string;
  contactPhone: string;
};

async function getSetting(key: string): Promise<string> {
  await initDb();
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', [key]);
  return row?.value ?? '';
}

async function setSetting(key: string, value: string): Promise<void> {
  await initDb();
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [key, value, Date.now()]
  );
}

export async function getEmergencyInfo(): Promise<EmergencyInfo> {
  const [name, allergies, conditions, contactName, contactPhone] = await Promise.all([
    getSetting(KEYS.name),
    getSetting(KEYS.allergies),
    getSetting(KEYS.conditions),
    getSetting(KEYS.contactName),
    getSetting(KEYS.contactPhone)
  ]);

  return { name, allergies, conditions, contactName, contactPhone };
}

export async function saveEmergencyInfo(info: EmergencyInfo): Promise<void> {
  await Promise.all([
    setSetting(KEYS.name, info.name),
    setSetting(KEYS.allergies, info.allergies),
    setSetting(KEYS.conditions, info.conditions),
    setSetting(KEYS.contactName, info.contactName),
    setSetting(KEYS.contactPhone, info.contactPhone)
  ]);
}

export async function buildEmergencySummaryText(info: EmergencyInfo): Promise<string> {
  const meds = await listMedications(true);
  const medLines: string[] = [];
  for (const med of meds) {
    const schedules = await listSchedulesForMedication(med.id);
    let frequency = 'schedule unavailable';
    if (schedules[0]) {
      try {
        const payload = decodeSchedulePayload<SchedulePayload>(schedules[0]);
        if (schedules[0].type === 'fixed_times') frequency = `daily at ${(payload as any).times.join(', ')}`;
        else if (schedules[0].type === 'every_x_hours') frequency = `every ${(payload as any).intervalHours}h`;
        else if (schedules[0].type === 'days_of_week') frequency = `days ${(payload as any).days.join(',')} at ${(payload as any).time}`;
        else frequency = 'PRN';
      } catch {
        frequency = 'schedule unavailable';
      }
    }

    medLines.push(`- ${med.name}${med.dosage ? ` (${med.dosage})` : ''} — ${frequency}`);
  }

  return [
    'RxShield Emergency Card',
    '',
    `Name: ${info.name || 'N/A'}`,
    `Allergies: ${info.allergies || 'N/A'}`,
    `Conditions: ${info.conditions || 'N/A'}`,
    `Emergency Contact: ${info.contactName || 'N/A'}${info.contactPhone ? ` (${info.contactPhone})` : ''}`,
    '',
    'Current Medications:',
    medLines.length ? medLines.join('\n') : '- None listed',
    '',
    'In an emergency, call local emergency services.'
  ].join('\n');
}
