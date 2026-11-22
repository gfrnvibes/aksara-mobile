import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { IslamicPattern } from '@/src/components/IslamicPattern';
import { useAuth } from '@/src/context/AuthContext';
import { apiRequest, getApiUrl, setApiUrl } from '@/src/lib/api';
import {
  registerForPushNotificationsAsync,
  syncJadwalLocalNotifications,
} from '@/src/lib/notifications';

export default function ProfilScreen() {
  const {
    user,
    tahunAjaran,
    logout,
    biometricAvailable,
    biometricEnabled,
    toggleBiometric,
    updateSavedBiometricPassword,
  } = useAuth();
  const [apiUrl, setApiUrlInput] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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

  async function handleToggleBiometric(value: boolean) {
    const ok = await toggleBiometric(value);
    if (!ok && value) {
      Alert.alert('Gagal', 'Verifikasi biometrik dibatalkan atau tidak tersedia di perangkat ini.');
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Perhatian', 'Lengkapi semua kolom password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Perhatian', 'Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Perhatian', 'Konfirmasi password baru tidak cocok.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiRequest<{ message: string }>('/auth/password', {
        method: 'POST',
        body: {
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        },
      });
      await updateSavedBiometricPassword(newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Berhasil', res.message);
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal mengubah password.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={['#064e3b', '#0f766e']} style={styles.headerCard}>
        <IslamicPattern opacity={0.16} />
        <Ionicons name="person-circle" size={56} color="#fde68a" />
        <Text style={styles.name}>
          {user?.role === 'siswa'
            ? (user?.siswa?.nama ?? user?.name)
            : (user?.gtk?.nama ?? user?.name)}
        </Text>
        <Text style={styles.role}>
          {user?.role === 'siswa'
            ? `Siswa • ${user?.siswa?.kelas ?? 'Belum ada kelas'}`
            : (user?.gtk?.jenis_gtk ?? 'Guru')}
        </Text>
      </LinearGradient>

      {user?.role === 'siswa' ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Identitas Siswa</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <Text style={styles.value}>{user?.siswa?.nama ?? user?.name ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>NIS</Text>
            <Text style={styles.value}>{user?.siswa?.nis ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>NISN</Text>
            <Text style={styles.value}>{user?.siswa?.nisn ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>NIK</Text>
            <Text style={styles.value}>{user?.siswa?.nik ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Jenis Kelamin</Text>
            <Text style={styles.value}>{user?.siswa?.jenis_kelamin ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tempat, Tgl Lahir</Text>
            <Text style={styles.value}>
              {[user?.siswa?.tempat_lahir, user?.siswa?.tanggal_lahir].filter(Boolean).join(', ') || '—'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Agama</Text>
            <Text style={styles.value}>{user?.siswa?.agama ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kelas</Text>
            <Text style={styles.value}>{user?.siswa?.kelas ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Wali Kelas</Text>
            <Text style={styles.value}>{user?.siswa?.wali_kelas ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tahun Ajaran</Text>
            <Text style={styles.value}>
              {tahunAjaran ? `${tahunAjaran.nama} (${tahunAjaran.semester})` : '—'}
            </Text>
          </View>
        </View>
      ) : (
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
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Keamanan Akun</Text>

        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.switchLabel}>Kunci Biometrik</Text>
            <Text style={styles.switchSub}>
              {biometricAvailable
                ? 'Gunakan sidik jari atau Face ID saat membuka aplikasi.'
                : 'Perangkat belum mengaktifkan sidik jari / Face ID.'}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleToggleBiometric}
            disabled={!biometricAvailable}
            trackColor={{ false: '#cbd5e1', true: '#10b981' }}
            thumbColor={biometricEnabled ? '#064e3b' : '#f8fafc'}
          />
        </View>

        <Pressable style={styles.secondaryBtn} onPress={() => setShowPasswordModal(true)}>
          <Ionicons name="key-outline" size={18} color="#065f46" />
          <Text style={styles.secondaryText}>Ganti Password</Text>
        </Pressable>
      </View>

      {user?.role !== 'siswa' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notifikasi & Pengingat Jadwal</Text>
          <Pressable style={styles.saveBtn} onPress={handleSyncNotif}>
            <Text style={styles.saveText}>Sinkronkan Pengingat Jadwal Hari Ini</Text>
          </Pressable>
        </View>
      )}

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

      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ganti Password</Text>
              <Pressable onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Password Saat Ini</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Masukkan password saat ini"
            />

            <Text style={styles.inputLabel}>Password Baru</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Minimal 6 karakter"
            />

            <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Ulangi password baru"
            />

            <Pressable
              style={[styles.saveBtn, savingPassword && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveText}>Simpan Password Baru</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
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
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  switchSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#065f46',
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    paddingVertical: 11,
  },
  secondaryText: { color: '#065f46', fontWeight: '700', fontSize: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingVertical: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
});
