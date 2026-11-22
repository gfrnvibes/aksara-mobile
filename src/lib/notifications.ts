import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiRequest } from './api';
import { deleteStoredItem, getStoredItem, setStoredItem } from './storage';

const PUSH_TOKEN_KEY = 'aksara_expo_push_token';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('jadwal-mengajar', {
        name: 'Pengingat Jadwal Mengajar',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;

    await apiRequest('/push-token', {
      method: 'POST',
      body: {
        token,
        platform: Platform.OS,
        device_name: Device.modelName ?? Device.deviceName ?? null,
      },
    });
    await setStoredItem(PUSH_TOKEN_KEY, token);

    return token;
  } catch {
    return null;
  }
}

export async function unregisterPushNotificationsAsync(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const token = await getStoredItem(PUSH_TOKEN_KEY);
    if (token) {
      await apiRequest('/push-token', {
        method: 'DELETE',
        body: { token },
      });
      await deleteStoredItem(PUSH_TOKEN_KEY);
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore errors when clearing push token on logout.
  }
}

export async function syncJadwalLocalNotifications(): Promise<number> {
  if (Platform.OS === 'web') {
    return 0;
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return 0;
    }

    const res = await apiRequest<{
      tanggal: string;
      sesi: {
        sumber_jadwal: string;
        kelas: string;
        mapel: string;
        jp_mulai: number;
        jp_selesai: number;
        mulai: string | null;
        waktu: string | null;
      }[];
    }>('/guru/sesi-hari-ini');

    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    let scheduledCount = 0;

    for (const sesi of res.sesi) {
      if (!sesi.mulai) continue;

      const [hh, mm] = sesi.mulai.split(':').map((n) => Number(n));
      if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

      const start = new Date();
      start.setHours(hh, mm, 0, 0);
      const triggerDate = new Date(start.getTime() - 10 * 60 * 1000);

      if (triggerDate.getTime() <= now.getTime()) {
        continue;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `10 Menit Lagi: ${sesi.mapel}`,
          body: `Kelas ${sesi.kelas} · JP ${sesi.jp_mulai}–${sesi.jp_selesai} (${sesi.waktu ?? ''})`,
          sound: 'default',
          data: { screen: 'jurnal', sumber_jadwal: sesi.sumber_jadwal },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: Platform.OS === 'android' ? 'jadwal-mengajar' : undefined,
        },
      });
      scheduledCount++;
    }

    return scheduledCount;
  } catch {
    return 0;
  }
}
