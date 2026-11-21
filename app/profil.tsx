import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { IslamicPattern } from '@/src/components/IslamicPattern';
import { useAuth } from '@/src/context/AuthContext';
import { getApiUrl, setApiUrl } from '@/src/lib/api';
import { registerForPushNotificationsAsync, syncJadwalLocalNotifications } from '@/src/lib/notifications';

export default function ProfilScreen() {
  const { user, tahunAjaran, logout } = useAuth();
  const [apiUrl, setApiUrlInput] = useState('');

  useEffect(() => {
    getApiUrl().then(setApiUrlInput);
  }, []);

  async function handleSaveServer() {
    await setApiUrl(apiUrl);
    Alert.alert('Tersimpan', 'Alamat server API diperbarui.');
  }

  async function handleSyncNotif() {
    await registerForPushNotificationsAsync();
    const count = await syncJadwalLocalNotifications();
    Alert.alert(
      'Pengingat Disinkronkan',
      count > 0
        ? `${count} pengingat jadwal mengajar hari ini (10 menit sebelum mulai) dijadwalkan.`
        : 'Tidak ada sesi mengajar tersisa hari ini untuk dijadwalkan.',
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={['#064e3b', '#0f766e']} style={styles.headerCard}>
        <IslamicPattern opacity={0.16} />
        <Ionicons name="person-circle" size={56} color="#fde68a" />
        <Text style={styles.name}>{user?.gtk?.nama ?? user?.name}</Text>
        <Text style={styles.role}>{user?.gtk?.jenis_gtk ?? 'Guru'}</Text>
      </LinearGradient>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>NIP</Text>
          <Text style={styles.value}>{user?.gtk?.nip ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>NUPTK</Text>
          <Text style={styles.value}>{user?.gtk?.nuptk ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tahun Ajaran</Text>
          <Text style={styles.value}>
            {tahunAjaran ? `${tahunAjaran.nama} (${tahunAjaran.semester})` : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifikasi & Pengingat Jadwal</Text>
        <Pressable style={styles.saveBtn} onPress={handleSyncNotif}>
          <Text style={styles.saveText}>Sinkronkan Pengingat Jadwal Hari Ini</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Alamat Server API</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrlInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={styles.saveBtn} onPress={handleSaveServer}>
          <Text style={styles.saveText}>Simpan URL Server</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color="#ffffff" />
        <Text style={styles.logoutText}>Keluar dari Akun</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 16, paddingBottom: 32 },
  headerCard: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  name: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginTop: 8 },
  role: { fontSize: 13, color: '#fde68a', fontWeight: '600', marginTop: 2 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: { fontSize: 13, color: '#64748b' },
  value: { fontSize: 13, color: '#0f172a', fontWeight: '600', maxWidth: '65%', textAlign: 'right' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  logoutBtn: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
