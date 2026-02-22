import * as Notifications from 'expo-notifications';

/**
 * Initialize notifications handler
 */
export async function initializeNotifications(): Promise<void> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('Notifications not available in this environment:', error);
  }
}

/**
 * Schedule a notification at a specific time
 */
export async function scheduleNotification(
  title: string,
  message: string,
  date: Date
): Promise<string> {
  try {
    const now = new Date();
    const delayMs = Math.max(0, date.getTime() - now.getTime());
    const delaySeconds = Math.max(1, Math.ceil(delayMs / 1000));

    // Schedule at the specified time (using seconds as numeric trigger)
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        sound: true,
        badge: 1,
      },
      trigger: delaySeconds,
    } as any);

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule notification (not available in Expo Go):', error);
    return 'notification-skipped';
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Failed to cancel notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Failed to cancel all notifications:', error);
  }
}
