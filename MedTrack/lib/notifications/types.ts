export type Medication = {
  id: string;
  name: string;
  dosage?: string;
  instructions?: string;
  is_active: boolean;
};

export type Schedule = {
  id: string;
  medication_id: string;
  type: 'fixed_times' | 'every_x_hours' | 'days_of_week' | 'prn';
  payload_json: string;
  timezone?: string;
};

export type DoseEvent = {
  id: string;
  medication_id: string;
  schedule_id?: string | null;
  scheduled_for: number;
  status: 'due' | 'taken' | 'skipped' | 'missed';
  taken_at?: number | null;
  note?: string | null;
};

export type NotificationLink = {
  id: string;
  dose_event_id: string;
  medication_id: string;
  schedule_id?: string | null;
  notification_identifier: string;
  trigger_at: number;
  kind: 'dose' | 'snooze';
  created_at: number;
};

export type RxNotificationDbAdapter = {
  getActiveMedications(): Promise<Medication[]>;
  getSchedulesForMedication(medId: string): Promise<Schedule[]>;
  upsertDoseEventsForWindow(medId: string, fromMs: number, toMs: number): Promise<DoseEvent[]>;
  listDueDoseEvents(nowMs: number): Promise<DoseEvent[]>;
  markDoseTaken(doseEventId: string, takenAtMs: number): Promise<void>;
  markDoseSkipped(doseEventId: string, note?: string): Promise<void>;
  markDoseMissed(doseEventId: string): Promise<void>;
  saveNotificationLink(link: NotificationLink): Promise<void>;
  listNotificationLinksForMedication(medId: string): Promise<NotificationLink[]>;
  deleteNotificationLinkByIdentifier(identifier: string): Promise<void>;
  deleteAllNotificationLinksForMedication(medId: string): Promise<void>;
  deleteNotificationLinksForDoseEvent(doseEventId: string): Promise<void>;
};

export type NotificationPayload = {
  doseEventId: string;
  medicationId: string;
  kind: 'dose' | 'snooze';
};
