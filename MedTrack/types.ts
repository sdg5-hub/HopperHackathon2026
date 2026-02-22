export type Reminder = {
  time: string;
  text: string;
};

export type MedicationForm = 'pill' | 'liquid' | 'injection' | 'other';

export type ScheduleType = 'fixed_times' | 'every_x_hours' | 'days_of_week' | 'prn';

export enum DoseStatus {
  DUE = 'due',
  TAKEN = 'taken',
  SKIPPED = 'skipped',
  MISSED = 'missed',
}



export type FixedTimesPayload = {
  times: string[];
};

export type EveryXHoursPayload = {
  intervalHours: number;
  startTime: string;
};

export type DaysOfWeekPayload = {
  days: number[];
  time: string;
};

export type PrnPayload = {
  notes?: string;
};

export type SchedulePayload = FixedTimesPayload | EveryXHoursPayload | DaysOfWeekPayload | PrnPayload;

export type User = {
  id: string;
  displayName: string | null;
  createdAt: number;
};

export type Medication = {
  id: string;
  userId: string | null;
  name: string;
  dosage: string | null;
  form: MedicationForm | null;
  instructions: string | null;
  startDate: number | null;
  endDate: number | null;
  isActive: 0 | 1;
  createdAt: number;
  updatedAt: number;
};

export type Schedule = {
  id: string;
  medicationId: string;
  type: ScheduleType;
  payloadJson: string;
  timezone: string | null;
  createdAt: number;
  updatedAt: number;
};

export type ScheduleDecoded<T extends SchedulePayload = SchedulePayload> = Omit<Schedule, 'payloadJson'> & {
  payload: T;
};

export type WarningTag = {
  id: string;
  label: string;
};

export type DoseEvent = {
  id: string;
  medicationId: string;
  scheduleId: string | null;
  scheduledFor: number;
  status: DoseStatus;
  takenAt: number | null;
  note: string | null;
  createdAt: number;
  updatedAt: number;
};

export type CreateMedicationInput = {
  userId?: string | null;
  name: string;
  dosage?: string | null;
  form?: MedicationForm | null;
  instructions?: string | null;
  startDate?: number | null;
  endDate?: number | null;
  isActive?: 0 | 1;
};

export type UpdateMedicationPatch = Partial<Omit<CreateMedicationInput, 'name'>> & {
  name?: string;
};

export type CreateScheduleInput<T extends SchedulePayload = SchedulePayload> = {
  medicationId: string;
  type: ScheduleType;
  payload: T;
  timezone?: string | null;
};

export type UpdateSchedulePatch<T extends SchedulePayload = SchedulePayload> = {
  type?: ScheduleType;
  payload?: T;
  timezone?: string | null;
};

export type CreateDoseEventInput = {
  medicationId: string;
  scheduleId?: string | null;
  scheduledFor: number;
  status?: DoseStatus;
  takenAt?: number | null;
  note?: string | null;
};
