import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { DoseEvent, Medication, NotificationLink, RxNotificationDbAdapter } from './types';

export const RX_REMINDER_CHANNEL_ID = 'medtrack-reminders';
export const ROLLING_WINDOW_DAYS = 7;

function nowMs(): number {
  return Date.now();
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function windowBounds(fromMs = nowMs()): { fromMs: number; toMs: number } {
  return {
    fromMs,
    toMs: fromMs + ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000
  };
}

function buildBody(medication: Medication): string {
  const dosage = medication.dosage ? ` ${medication.dosage}` : '';
  const warning = medication.instructions ? ` • ${medication.instructions.slice(0, 60)}` : '';
  return `${medication.name}${dosage} due now.${warning}`;
}

function isFuture(ms: number): boolean {
  return ms > nowMs();
}

function dedupeKey(link: Pick<NotificationLink, 'dose_event_id' | 'trigger_at' | 'kind'>): string {
  return `${link.dose_event_id}:${link.trigger_at}:${link.kind}`;
}

async function safeCancel(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.warn('[notifications] cancel failed', identifier, error);
  }
}

async function findDoseEventNowDue(db: RxNotificationDbAdapter, doseEventId: string): Promise<DoseEvent | null> {
  const due = await db.listDueDoseEvents(nowMs());
  return due.find((event) => event.id === doseEventId) ?? null;
}

async function findMedicationIdForDoseFromLinks(
  db: RxNotificationDbAdapter,
  doseEventId: string
): Promise<string | null> {
  const meds = await db.getActiveMedications();
  for (const med of meds) {
    const links = await db.listNotificationLinksForMedication(med.id);
    const match = links.find((link) => link.dose_event_id === doseEventId);
    if (match) {
      return match.medication_id;
    }
  }
  return null;
}

async function getDoseContext(
  db: RxNotificationDbAdapter,
  doseEventId: string
): Promise<{ dose: DoseEvent | null; medicationId: string | null }> {
  const dueDose = await findDoseEventNowDue(db, doseEventId);
  if (dueDose) {
    return { dose: dueDose, medicationId: dueDose.medication_id };
  }

  const medicationId = await findMedicationIdForDoseFromLinks(db, doseEventId);
  return { dose: null, medicationId };
}

export async function initNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(RX_REMINDER_CHANNEL_ID, {
      name: 'MedTrack Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default'
    });
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    if (!existing.granted) {
      await Notifications.requestPermissionsAsync();
    }
  } catch (error) {
    console.warn('[notifications] permission check failed', error);
  }
}

export async function cancelMedicationNotifications(db: RxNotificationDbAdapter, medicationId: string): Promise<void> {
  const links = await db.listNotificationLinksForMedication(medicationId);

  await Promise.all(
    links.map(async (link) => {
      await safeCancel(link.notification_identifier);
      await db.deleteNotificationLinkByIdentifier(link.notification_identifier);
    })
  );

  await db.deleteAllNotificationLinksForMedication(medicationId);
}

export async function scheduleDoseNotificationsForWindow(
  db: RxNotificationDbAdapter,
  medicationId: string,
  fromMs: number,
  toMs: number
): Promise<void> {
  const medications = await db.getActiveMedications();
  const medication = medications.find((item) => item.id === medicationId);
  if (!medication || !medication.is_active) {
    return;
  }

  const schedules = await db.getSchedulesForMedication(medicationId);
  if (!schedules.length) {
    return;
  }

  const events = await db.upsertDoseEventsForWindow(medicationId, fromMs, toMs);
  const existingLinks = await db.listNotificationLinksForMedication(medicationId);
  const existingKeys = new Set(existingLinks.map((link) => dedupeKey(link)));

  for (const event of events) {
    if (event.status !== 'due' || !isFuture(event.scheduled_for)) {
      continue;
    }

    const key = dedupeKey({
      dose_event_id: event.id,
      trigger_at: event.scheduled_for,
      kind: 'dose'
    });

    if (existingKeys.has(key)) {
      continue;
    }

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder',
          body: buildBody(medication),
          data: {
            doseEventId: event.id,
            medicationId,
            kind: 'dose'
          },
          sound: 'default'
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(event.scheduled_for),
          ...(Platform.OS === 'android' ? { channelId: RX_REMINDER_CHANNEL_ID } : {})
        }
      });

      await db.saveNotificationLink({
        id: makeId('nlink'),
        dose_event_id: event.id,
        medication_id: medicationId,
        schedule_id: event.schedule_id ?? null,
        notification_identifier: identifier,
        trigger_at: event.scheduled_for,
        kind: 'dose',
        created_at: nowMs()
      });

      existingKeys.add(key);
    } catch (error) {
      console.warn('[notifications] schedule dose failed', { medicationId, doseEventId: event.id, error });
    }
  }
}

export async function resyncMedication(db: RxNotificationDbAdapter, medicationId: string): Promise<void> {
  await cancelMedicationNotifications(db, medicationId);

  const meds = await db.getActiveMedications();
  const target = meds.find((m) => m.id === medicationId);
  if (!target || !target.is_active) {
    return;
  }

  const { fromMs, toMs } = windowBounds();
  await scheduleDoseNotificationsForWindow(db, medicationId, fromMs, toMs);
}

export async function resyncAllSchedules(db: RxNotificationDbAdapter): Promise<void> {
  const meds = await db.getActiveMedications();
  const { fromMs, toMs } = windowBounds();

  for (const med of meds) {
    if (!med.is_active) {
      continue;
    }

    try {
      await scheduleDoseNotificationsForWindow(db, med.id, fromMs, toMs);
    } catch (error) {
      console.warn('[notifications] resync medication failed', med.id, error);
    }
  }
}

export async function snoozeDose(db: RxNotificationDbAdapter, doseEventId: string, minutes: 10 | 30 | 60): Promise<void> {
  const context = await getDoseContext(db, doseEventId);
  if (!context.medicationId) {
    throw new Error('DOSE_EVENT_NOT_FOUND');
  }

  const medication = (await db.getActiveMedications()).find((m) => m.id === context.medicationId);
  const existingLinks = await db.listNotificationLinksForMedication(context.medicationId);

  const currentFutureSnoozes = existingLinks.filter(
    (link) => link.dose_event_id === doseEventId && link.kind === 'snooze' && isFuture(link.trigger_at)
  );

  await Promise.all(
    currentFutureSnoozes.map(async (link) => {
      await safeCancel(link.notification_identifier);
      await db.deleteNotificationLinkByIdentifier(link.notification_identifier);
    })
  );

  const triggerAt = nowMs() + minutes * 60 * 1000;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Snoozed Medication Reminder',
      body: medication ? buildBody(medication) : 'Dose is due now.',
      data: {
        doseEventId,
        medicationId: context.medicationId,
        kind: 'snooze'
      },
      sound: 'default'
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(triggerAt),
      ...(Platform.OS === 'android' ? { channelId: RX_REMINDER_CHANNEL_ID } : {})
    }
  });

  await db.saveNotificationLink({
    id: makeId('nlink'),
    dose_event_id: doseEventId,
    medication_id: context.medicationId,
    schedule_id: context.dose?.schedule_id ?? null,
    notification_identifier: identifier,
    trigger_at: triggerAt,
    kind: 'snooze',
    created_at: nowMs()
  });
}

async function resolveDose(
  db: RxNotificationDbAdapter,
  doseEventId: string,
  resolveFn: () => Promise<void>
): Promise<void> {
  const context = await getDoseContext(db, doseEventId);
  if (!context.medicationId) {
    throw new Error('DOSE_EVENT_NOT_FOUND');
  }

  const links = await db.listNotificationLinksForMedication(context.medicationId);
  const targetLinks = links.filter((link) => link.dose_event_id === doseEventId);

  await Promise.all(
    targetLinks.map(async (link) => {
      await safeCancel(link.notification_identifier);
      await db.deleteNotificationLinkByIdentifier(link.notification_identifier);
    })
  );

  await db.deleteNotificationLinksForDoseEvent(doseEventId);
  await resolveFn();
}

export async function resolveDoseAsTaken(db: RxNotificationDbAdapter, doseEventId: string): Promise<void> {
  await resolveDose(db, doseEventId, () => db.markDoseTaken(doseEventId, nowMs()));
}

export async function resolveDoseAsSkipped(db: RxNotificationDbAdapter, doseEventId: string, note?: string): Promise<void> {
  await resolveDose(db, doseEventId, () => db.markDoseSkipped(doseEventId, note));
}
