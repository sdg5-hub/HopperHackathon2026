import * as Crypto from 'expo-crypto';
import { Errors } from './errors';

export function generateId(): string {
  return Crypto.randomUUID();
}

export function nowMs(): number {
  return Date.now();
}

export function jsonSerialize(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    throw Errors.VALIDATION('Failed to serialize JSON payload');
  }
}

export function jsonParse<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw Errors.VALIDATION('Failed to parse JSON payload');
  }
}

export function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw Errors.VALIDATION(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function assertNullableString(value: unknown, field: string): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw Errors.VALIDATION(`${field} must be a string`);
  }
  return value.trim();
}

export function assertUnixMs(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw Errors.VALIDATION(`${field} must be a valid unix millisecond value`);
  }
  return Math.floor(value);
}

export function assertOptionalUnixMs(value: unknown, field: string): number | null {
  if (value == null) {
    return null;
  }
  return assertUnixMs(value, field);
}

export function assertInSet<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw Errors.VALIDATION(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
}

export function placeholders(count: number): string {
  return new Array(count).fill('?').join(',');
}

export function toSnakeCaseLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
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
    const item = parts.find((part) => part.type === type)?.value;
    return item ? Number(item) : 0;
  };

  const asUtc = Date.UTC(lookup('year'), lookup('month') - 1, lookup('day'), lookup('hour'), lookup('minute'), lookup('second'));
  return asUtc - date.getTime();
}

export function getDayBoundsUtcMs(dateISO: string, timeZone: string): { startMs: number; endMs: number } {
  const [year, month, day] = dateISO.split('-').map(Number);
  if (!year || !month || !day) {
    throw Errors.VALIDATION('dateISO must be YYYY-MM-DD');
  }

  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const offset = getOffsetMsForTimeZone(new Date(utcGuess), timeZone);
  const startMs = utcGuess - offset;
  return { startMs, endMs: startMs + 24 * 60 * 60 * 1000 };
}
