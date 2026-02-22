import type { DoseEvent } from '@/lib/db/types';

export type DailyAdherencePoint = {
  dateKey: string;
  adherencePct: number;
  scheduledCount: number;
  takenCount: number;
};

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Computes adherence percent for the trailing 7 days (including today).
 * Scheduled doses are due doses within range and not in the future.
 */
export function computeSevenDayAdherence(doses: DoseEvent[], nowMs: number): { adherencePct: number; scheduledCount: number; takenCount: number } {
  const start = nowMs - 7 * 24 * 60 * 60 * 1000;
  const relevant = doses.filter((dose) => dose.scheduledFor >= start && dose.scheduledFor <= nowMs);
  const scheduled = relevant.length;
  const taken = relevant.filter((dose) => dose.status === 'taken').length;

  if (scheduled === 0) {
    return { adherencePct: 0, scheduledCount: 0, takenCount: 0 };
  }

  return {
    adherencePct: Math.round((taken / scheduled) * 100),
    scheduledCount: scheduled,
    takenCount: taken
  };
}

export function buildDailyAdherenceSeries(doses: DoseEvent[], nowMs: number): DailyAdherencePoint[] {
  const start = nowMs - 14 * 24 * 60 * 60 * 1000;
  const relevant = doses.filter((dose) => dose.scheduledFor >= start && dose.scheduledFor <= nowMs);

  const grouped = new Map<string, { scheduled: number; taken: number }>();
  for (const dose of relevant) {
    const key = dayKey(dose.scheduledFor);
    const item = grouped.get(key) ?? { scheduled: 0, taken: 0 };
    item.scheduled += 1;
    if (dose.status === 'taken') item.taken += 1;
    grouped.set(key, item);
  }

  return Array.from(grouped.entries())
    .map(([dateKey, counts]) => ({
      dateKey,
      adherencePct: counts.scheduled ? Math.round((counts.taken / counts.scheduled) * 100) : 0,
      scheduledCount: counts.scheduled,
      takenCount: counts.taken
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function computeStreak(dailyAdherence: DailyAdherencePoint[], thresholdPct: number): number {
  const sorted = [...dailyAdherence].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  let streak = 0;
  for (const day of sorted) {
    if (day.scheduledCount === 0) {
      continue;
    }
    if (day.adherencePct >= thresholdPct) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export function computeTrendHint(dailyAdherence: DailyAdherencePoint[]): string {
  if (dailyAdherence.length < 8) return 'Trend unavailable yet.';
  const current = dailyAdherence.slice(-7).reduce((sum, d) => sum + d.adherencePct, 0) / 7;
  const prev = dailyAdherence.slice(-14, -7).reduce((sum, d) => sum + d.adherencePct, 0) / 7;
  if (current > prev + 1) return `↑ ${Math.round(current - prev)}% vs prior 7 days`;
  if (current < prev - 1) return `↓ ${Math.round(prev - current)}% vs prior 7 days`;
  return '→ Similar to prior 7 days';
}
