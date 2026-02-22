import assert from 'node:assert/strict';

function computeSevenDayAdherence(doses, nowMs) {
  const start = nowMs - 7 * 24 * 60 * 60 * 1000;
  const relevant = doses.filter((dose) => dose.scheduledFor >= start && dose.scheduledFor <= nowMs);
  const scheduled = relevant.length;
  const taken = relevant.filter((dose) => dose.status === 'taken').length;
  return scheduled ? Math.round((taken / scheduled) * 100) : 0;
}

function autoMissDecision(nowMs, dueMs, windowMs) {
  return nowMs > dueMs + windowMs;
}

const now = Date.now();
assert.equal(
  computeSevenDayAdherence(
    [
      { scheduledFor: now - 1000, status: 'taken' },
      { scheduledFor: now - 2000, status: 'missed' },
      { scheduledFor: now - 3000, status: 'taken' }
    ],
    now
  ),
  67
);
assert.equal(autoMissDecision(now, now - 3 * 60 * 60 * 1000, 2 * 60 * 60 * 1000), true);
assert.equal(autoMissDecision(now, now - 30 * 60 * 1000, 2 * 60 * 60 * 1000), false);
console.log('adherence tests passed');
