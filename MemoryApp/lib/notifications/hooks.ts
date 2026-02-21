import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { resolveDoseAsSkipped, resolveDoseAsTaken, snoozeDose } from './engine';
import type { DoseEvent, NotificationPayload, RxNotificationDbAdapter } from './types';

function extractPayload(data: unknown): NotificationPayload | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const source = data as Record<string, unknown>;
  const doseEventId = source.doseEventId;
  const medicationId = source.medicationId;
  const kind = source.kind;

  if (typeof doseEventId !== 'string' || typeof medicationId !== 'string') {
    return null;
  }

  if (kind !== 'dose' && kind !== 'snooze') {
    return null;
  }

  return { doseEventId, medicationId, kind };
}

async function findDueById(db: RxNotificationDbAdapter, doseEventId: string): Promise<DoseEvent | null> {
  const due = await db.listDueDoseEvents(Date.now());
  return due.find((item) => item.id === doseEventId) ?? null;
}

export function useRxDueModal(db: RxNotificationDbAdapter) {
  const [dueDose, setDueDose] = useState<DoseEvent | null>(null);

  const openDueDose = useCallback(
    async (doseEventId: string) => {
      const event = await findDueById(db, doseEventId);
      if (event) {
        setDueDose(event);
      }
    },
    [db]
  );

  const close = useCallback(() => {
    setDueDose(null);
  }, []);

  const markTaken = useCallback(async () => {
    if (!dueDose) return;
    await resolveDoseAsTaken(db, dueDose.id);
    close();
  }, [db, dueDose, close]);

  const markSkipped = useCallback(async () => {
    if (!dueDose) return;
    await resolveDoseAsSkipped(db, dueDose.id);
    close();
  }, [db, dueDose, close]);

  const snooze = useCallback(
    async (minutes: 10 | 30 | 60) => {
      if (!dueDose) return;
      await snoozeDose(db, dueDose.id, minutes);
      close();
    },
    [db, dueDose, close]
  );

  useEffect(() => {
    let mounted = true;

    const checkPendingDue = async () => {
      const due = await db.listDueDoseEvents(Date.now());
      if (mounted && due.length && !dueDose) {
        due.sort((a, b) => a.scheduled_for - b.scheduled_for);
        setDueDose(due[0]);
      }
    };

    const processLastResponse = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      const payload = extractPayload(response?.notification.request.content.data);
      if (payload && mounted) {
        await openDueDose(payload.doseEventId);
      }
    };

    processLastResponse().catch((error) => console.warn('[notifications] last response error', error));
    checkPendingDue().catch((error) => console.warn('[notifications] due check error', error));

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const payload = extractPayload(response.notification.request.content.data);
      if (!payload) return;
      openDueDose(payload.doseEventId).catch((error) => {
        console.warn('[notifications] open due dose failed', error);
      });
    });

    const appSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkPendingDue().catch((error) => console.warn('[notifications] app active due check failed', error));
      }
    });

    return () => {
      mounted = false;
      sub.remove();
      appSub.remove();
    };
  }, [db, dueDose, openDueDose]);

  return { dueDose, openDueDose, close, snooze, markTaken, markSkipped };
}
