# Notification Engine Test Steps

This module provides local scheduled reminders only (Expo `expo-notifications`).

## Quick test flow

1. Initialize db and notifications:
   - Call `initNotifications()`
   - Call `resyncAllSchedules(db)`
2. Create one fixed-time medication schedule 1 minute in the future.
3. Wait for the notification to fire.
4. Tap the notification:
   - Due modal should open (via `useRxDueModal`).
5. Tap `Snooze 10`:
   - Existing future snooze for the same dose should be replaced.
   - New snooze notification should appear in ~10 minutes.
6. Tap `Taken`:
   - Dose status should become `taken`.
   - Linked notifications (`dose` + `snooze`) should be cancelled and links removed.
7. Update medication schedule and call `resyncMedication(db, medId)`:
   - Old notifications should be cancelled.
   - Fresh notifications for new schedule should be created.

## Notes

- Android channel: `medtrack-reminders` is created with HIGH importance.
- If exact alarm permissions are restricted, delivery may be best-effort.
- No remote push services are used.
