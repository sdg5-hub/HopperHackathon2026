import type {
  DoseEvent,
  Medication,
  NotificationLink,
  RxNotificationDbAdapter,
  Schedule
} from './types';

type InMemorySeed = {
  medications?: Medication[];
  schedules?: Schedule[];
  doseEvents?: DoseEvent[];
  links?: NotificationLink[];
};

function nowMs(): number {
  return Date.now();
}

function id(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  const lookup = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return value ? Number(value) : 0;
  };

  const asUtc = Date.UTC(lookup('year'), lookup('month') - 1, lookup('day'), lookup('hour'), lookup('minute'), lookup('second'));
  return asUtc - date.getTime();
}

function zonedDateTimeToUtcMs(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const offset1 = getOffsetMsForTimeZone(new Date(guess), timeZone);
  let ts = guess - offset1;
  const offset2 = getOffsetMsForTimeZone(new Date(ts), timeZone);
  if (offset2 !== offset1) {
    ts = guess - offset2;
  }
  return ts;
}

function toZonedDateParts(date: Date, timeZone: string): { year: number; month: number; day: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes): string => parts.find((part) => part.type === type)?.value ?? '';
  const weekdayShort = lookup('weekday');
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    year: Number(lookup('year')),
    month: Number(lookup('month')),
    day: Number(lookup('day')),
    weekday: weekdayMap[weekdayShort] ?? 0
  };
}

function parseTime(value: string): { hour: number; minute: number } {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0
  };
}

export class InMemoryNotificationDb implements RxNotificationDbAdapter {
  private medications: Medication[];
  private schedules: Schedule[];
  private doseEvents: DoseEvent[];
  private links: NotificationLink[];

  constructor(seed: InMemorySeed = {}) {
    this.medications = seed.medications ?? [];
    this.schedules = seed.schedules ?? [];
    this.doseEvents = seed.doseEvents ?? [];
    this.links = seed.links ?? [];
  }

  async getActiveMedications(): Promise<Medication[]> {
    return this.medications.filter((m) => m.is_active);
  }

  async getSchedulesForMedication(medId: string): Promise<Schedule[]> {
    return this.schedules.filter((s) => s.medication_id === medId);
  }

  async upsertDoseEventsForWindow(medId: string, fromMs: number, toMs: number): Promise<DoseEvent[]> {
    const schedules = this.schedules.filter((s) => s.medication_id === medId && s.type !== 'prn');
    const created: DoseEvent[] = [];

    for (const schedule of schedules) {
      const tz = schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const payload = JSON.parse(schedule.payload_json) as Record<string, any>;

      // Iterate by UTC day and convert to timezone-local day for generation.
      for (let cursor = fromMs; cursor <= toMs; cursor += 24 * 60 * 60 * 1000) {
        const dateParts = toZonedDateParts(new Date(cursor), tz);

        const addEvent = (hour: number, minute: number) => {
          const scheduledFor = zonedDateTimeToUtcMs(dateParts.year, dateParts.month, dateParts.day, hour, minute, tz);
          if (scheduledFor < fromMs || scheduledFor > toMs) return;

          const exists = this.doseEvents.find(
            (event) =>
              event.medication_id === medId &&
              (event.schedule_id ?? null) === schedule.id &&
              event.scheduled_for === scheduledFor
          );

          if (exists) {
            created.push(exists);
            return;
          }

          const item: DoseEvent = {
            id: id('dose'),
            medication_id: medId,
            schedule_id: schedule.id,
            scheduled_for: scheduledFor,
            status: 'due',
            taken_at: null,
            note: null
          };
          this.doseEvents.push(item);
          created.push(item);
        };

        if (schedule.type === 'fixed_times') {
          const times = Array.isArray(payload.times) ? (payload.times as string[]) : [];
          times.forEach((time) => {
            const parsed = parseTime(time);
            addEvent(parsed.hour, parsed.minute);
          });
        }

        if (schedule.type === 'days_of_week') {
          const days = Array.isArray(payload.days) ? (payload.days as number[]) : [];
          if (days.includes(dateParts.weekday)) {
            const parsed = parseTime(String(payload.time ?? '09:00'));
            addEvent(parsed.hour, parsed.minute);
          }
        }

        if (schedule.type === 'every_x_hours') {
          const interval = Number(payload.intervalHours) || 8;
          const start = parseTime(String(payload.startTime ?? '07:00'));
          for (let h = start.hour; h < 24; h += interval) {
            addEvent(h, start.minute);
          }
        }
      }
    }

    return created.sort((a, b) => a.scheduled_for - b.scheduled_for);
  }

  async listDueDoseEvents(now: number): Promise<DoseEvent[]> {
    return this.doseEvents
      .filter((event) => event.status === 'due' && event.scheduled_for <= now)
      .sort((a, b) => a.scheduled_for - b.scheduled_for);
  }

  async markDoseTaken(doseEventId: string, takenAtMs: number): Promise<void> {
    const event = this.doseEvents.find((item) => item.id === doseEventId);
    if (!event) throw new Error('NOT_FOUND');
    event.status = 'taken';
    event.taken_at = takenAtMs;
  }

  async markDoseSkipped(doseEventId: string, note?: string): Promise<void> {
    const event = this.doseEvents.find((item) => item.id === doseEventId);
    if (!event) throw new Error('NOT_FOUND');
    event.status = 'skipped';
    event.note = note ?? null;
  }

  async markDoseMissed(doseEventId: string): Promise<void> {
    const event = this.doseEvents.find((item) => item.id === doseEventId);
    if (!event) throw new Error('NOT_FOUND');
    event.status = 'missed';
  }

  async saveNotificationLink(link: NotificationLink): Promise<void> {
    const exists = this.links.find(
      (item) => item.dose_event_id === link.dose_event_id && item.trigger_at === link.trigger_at && item.kind === link.kind
    );
    if (!exists) {
      this.links.push(link);
    }
  }

  async listNotificationLinksForMedication(medId: string): Promise<NotificationLink[]> {
    return this.links.filter((link) => link.medication_id === medId);
  }

  async deleteNotificationLinkByIdentifier(identifier: string): Promise<void> {
    this.links = this.links.filter((link) => link.notification_identifier !== identifier);
  }

  async deleteAllNotificationLinksForMedication(medId: string): Promise<void> {
    this.links = this.links.filter((link) => link.medication_id !== medId);
  }

  async deleteNotificationLinksForDoseEvent(doseEventId: string): Promise<void> {
    this.links = this.links.filter((link) => link.dose_event_id !== doseEventId);
  }
}

export function createDemoInMemoryDb(): InMemoryNotificationDb {
  const now = nowMs();
  const med1: Medication = {
    id: 'med-1',
    name: 'Lisinopril',
    dosage: '10 mg',
    instructions: 'Take with water',
    is_active: true
  };

  const med2: Medication = {
    id: 'med-2',
    name: 'Metformin',
    dosage: '500 mg',
    instructions: 'Take with food',
    is_active: true
  };

  const med3: Medication = {
    id: 'med-3',
    name: 'Albuterol',
    dosage: '2 puffs',
    instructions: 'As needed',
    is_active: true
  };

  const schedules: Schedule[] = [
    {
      id: 'sch-1',
      medication_id: med1.id,
      type: 'fixed_times',
      payload_json: JSON.stringify({ times: ['09:00', '21:00'] }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    {
      id: 'sch-2',
      medication_id: med2.id,
      type: 'every_x_hours',
      payload_json: JSON.stringify({ intervalHours: 12, startTime: '08:00' }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    {
      id: 'sch-3',
      medication_id: med3.id,
      type: 'prn',
      payload_json: JSON.stringify({ notes: 'as needed' }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  ];

  const dueEvent: DoseEvent = {
    id: 'due-1',
    medication_id: med1.id,
    schedule_id: 'sch-1',
    scheduled_for: now - 60 * 1000,
    status: 'due',
    taken_at: null,
    note: null
  };

  return new InMemoryNotificationDb({
    medications: [med1, med2, med3],
    schedules,
    doseEvents: [dueEvent],
    links: []
  });
}
