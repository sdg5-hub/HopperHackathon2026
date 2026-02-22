import { seedDemoData } from '@/db/db';
import {
  listMedications,
  listSchedulesForMedication,
  listDoseEventsInRange,
  createDoseEvent,
  decodeSchedulePayload,
} from '@/db/queries';
import { Medication, Schedule, DoseEvent, DoseStatus, FixedTimesPayload } from '@/types';
import { scheduleNotification } from '@/services/notifications';

export type ReminderItem = {
  id: string;
  time: string;
  text: string;
  medicationId?: string;
  scheduleId?: string;
  doseEventId?: string;
  status?: DoseStatus;
};

export type RemindersByDate = Record<string, ReminderItem[]>;

/**
 * Initialize database and seed demo data if empty
 */
export async function initializeDatabase(): Promise<void> {
  await seedDemoData();
}

/**
 * Convert dose events to reminder items grouped by date
 */
function doseEventsToReminders(doseEvents: DoseEvent[], medications: Medication[]): RemindersByDate {
  const reminders: RemindersByDate = {};
  const medMap = new Map(medications.map((m) => [m.id, m]));

  for (const event of doseEvents) {
    const med = medMap.get(event.medicationId);
    if (!med) continue;

    const date = new Date(event.scheduledFor);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    const reminderText = `${med.name}${med.dosage ? ` - ${med.dosage}` : ''}`;

    if (!reminders[dateKey]) {
      reminders[dateKey] = [];
    }

    reminders[dateKey].push({
      id: event.id,
      time: timeStr,
      text: reminderText,
      medicationId: event.medicationId,
      scheduleId: event.scheduleId || undefined,
      doseEventId: event.id,
      status: event.status,
    });
  }

  // Sort by time within each date
  Object.keys(reminders).forEach((dateKey) => {
    reminders[dateKey].sort((a, b) => a.time.localeCompare(b.time));
  });

  return reminders;
}

/**
 * Load reminders from database for a date range
 */
export async function loadRemindersFromDb(startDate: Date, endDate: Date): Promise<RemindersByDate> {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  const [medications, doseEvents] = await Promise.all([
    listMedications(true), // active only
    listDoseEventsInRange(startMs, endMs),
  ]);

  return doseEventsToReminders(doseEvents, medications);
}

/**
 * Add a new reminder and create dose event + notification
 */
export async function addReminderToDb(
  date: string,
  time: string,
  text: string,
  medicationId?: string
): Promise<ReminderItem> {
  // Parse date and time
  const [year, month, day] = date.split('-').map(Number);
  const timeMatch = /^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/.exec(time.trim());
  if (!timeMatch) throw new Error('Invalid time format');

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const meridian = timeMatch[3]?.toLowerCase();

  if (meridian) {
    hours = hours % 12;
    if (meridian === 'pm') hours += 12;
  }

  const scheduledFor = new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();

  // Create dose event
  const doseEvent = await createDoseEvent({
    medicationId: medicationId || 'manual-entry', // fallback for manual entries
    scheduleId: null,
    scheduledFor,
    status: DoseStatus.DUE,
  });

  // Schedule notification
  await scheduleNotification('Medication Reminder', text, new Date(scheduledFor));

  return {
    id: doseEvent.id,
    time,
    text,
    medicationId,
    doseEventId: doseEvent.id,
    status: doseEvent.status,
  };
}

/**
 * Get demo reminders (fallback/example data)
 */
export function getDemoReminders(): RemindersByDate {
  return {
    '2026-02-21': [
      { id: 'demo-1', time: '08:30 AM', text: 'Take medicine' },
      { id: 'demo-2', time: '12:00 PM', text: 'Call caregiver' },
    ],
    '2026-02-22': [
      { id: 'demo-3', time: '10:00 AM', text: 'Walk in park' },
      { id: 'demo-4', time: '03:30 PM', text: 'Drink water' },
    ],
  };
}
