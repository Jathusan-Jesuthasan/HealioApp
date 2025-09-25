import * as Notifications from "expo-notifications";

export async function scheduleDailyReminder(hour, minute, message) {
  await Notifications.scheduleNotificationAsync({
    content: { title: "Healio Reminder", body: message },
    trigger: { hour, minute, repeats: true },
  });
}
