import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { apiRequest, apiUpload, KehadiranGtkResponse, PengaturanPresensiInfo } from '@/src/lib/api';

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function PresensiLokasiScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [pengaturan, setPengaturan] = useState<PengaturanPresensiInfo | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [facing, setFacing] = useState<CameraType>('front');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadConfigAndGps = useCallback(async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const res = await apiRequest<KehadiranGtkResponse>('/guru/kehadiran-gtk');
      if (res.pengaturan_presensi) {
        setPengaturan(res.pengaturan_presensi);
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Izin lokasi GPS ditolak. Aktifkan izin lokasi untuk presensi.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null,
      });
    } catch (err) {
      setGpsError(err instanceof Error ? err.message : 'Gagal mengambil lokasi GPS.');
    } finally {
      setGpsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigAndGps();
  }, [loadConfigAndGps]);

  const jarakMeter = useMemo(() => {
    if (!coords || !pengaturan || pengaturan.latitude === null || pengaturan.longitude === null) {
      return null;
    }
    return haversineMeters(
      coords.latitude,
      coords.longitude,
      pengaturan.latitude,
      pengaturan.longitude,
    );
  }, [coords, pengaturan]);

  const dalamRadius = useMemo(() => {
    if (!pengaturan?.aktif || pengaturan.latitude === null || pengaturan.longitude === null) {
      return true;
    }
    if (jarakMeter === null) return false;
    return jarakMeter <= pengaturan.radius_meter;
  }, [pengaturan, jarakMeter]);

  async function handleTakePhoto() {
    if (!cameraRef.current) return;
    setCapturing(true);
    try {
      const raw = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!raw?.uri) return;
      const manipulated = await ImageManipulator.manipulateAsync(
        raw.uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      setPhotoUri(manipulated.uri);
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal mengambil foto.');
    } finally {
      setCapturing(false);
    }
  }

  async function handleSubmit() {
    if (!coords) {
      Alert.alert('Lokasi Belum Siap', 'Tunggu atau muat ulang lokasi GPS Anda terlebih dahulu.');
      return;
    }
    if (pengaturan?.aktif && pengaturan.wajib_foto && !photoUri) {
      Alert.alert('Foto Wajib', 'Ambil foto selfie atau lingkungan madrasah terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('latitude', String(coords.latitude));
      formData.append('longitude', String(coords.longitude));
      if (coords.accuracy !== null) {
        formData.append('akurasi_meter', String(coords.accuracy));
      }
      if (photoUri) {
        formData.append('foto', {
          uri: photoUri,
          name: `presensi-${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as unknown as Blob);
      }

      const res = await apiUpload<{ message: string; jarak_meter?: number | null }>(
        '/guru/kehadiran-gtk/hadir',
        formData,
      );
      Alert.alert(
        'Alhamdulillah',
        res.jarak_meter !== null && res.jarak_meter !== undefined
          ? `${res.message} (Jarak: ${res.jarak_meter} m)`
          : res.message,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert('Presensi Gagal', err instanceof Error ? err.message : 'Gagal mengirim presensi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={['#064e3b', '#0f766e']} style={styles.infoCard}>
        <View style={styles.rowGap}>
          <Ionicons name="time-outline" size={20} color="#fde68a" />
          <Text style={styles.infoTitle}>
            Jam Presensi: {pengaturan ? `${pengaturan.jam_mulai}–${pengaturan.jam_selesai} WIB` : 'Memuat...'}
          </Text>
        </View>
        <Text style={styles.infoSub}>
          Lokasi target: {pengaturan?.nama_lokasi ?? 'Madrasah'} · Radius maks {pengaturan?.radius_meter ?? 100} m
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.rowGap}>
            <Ionicons name="location" size={20} color="#065f46" />
            <Text style={styles.sectionTitle}>Lokasi GPS Anda</Text>
          </View>
          <Pressable onPress={loadConfigAndGps} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={16} color="#065f46" />
            <Text style={styles.refreshText}>Perbarui</Text>
          </Pressable>
        </View>

        {gpsLoading ? (
          <View style={styles.gpsWait}>
            <ActivityIndicator color="#065f46" />
            <Text style={styles.gpsSub}>Mengambil koordinat GPS...</Text>
          </View>
        ) : gpsError ? (
          <Text style={styles.errorText}>{gpsError}</Text>
        ) : coords ? (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.coordText}>
              {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
              {coords.accuracy !== null ? ` (±${coords.accuracy} m)` : ''}
            </Text>
            {jarakMeter !== null && (
              <View style={[styles.radiusBadge, !dalamRadius && styles.radiusBadgeOut]}>
                <Ionicons
                  name={dalamRadius ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={dalamRadius ? '#065f46' : '#b91c1c'}
                />
                <Text style={[styles.radiusText, !dalamRadius && styles.radiusTextOut]}>
                  {dalamRadius
                    ? `Dalam radius (${jarakMeter} m dari ${pengaturan?.nama_lokasi})`
                    : `Di luar radius (${jarakMeter} m, maks ${pengaturan?.radius_meter} m)`}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.rowGap}>
            <Ionicons name="camera" size={20} color="#065f46" />
            <Text style={styles.sectionTitle}>
              Foto Bukti Kehadiran {pengaturan?.wajib_foto ? '(Wajib)' : '(Opsional)'}
            </Text>
          </View>
          {!photoUri && (
            <Pressable
              onPress={() => setFacing((prev) => (prev === 'front' ? 'back' : 'front'))}
              style={styles.refreshBtn}
            >
              <Ionicons name="camera-reverse-outline" size={16} color="#065f46" />
              <Text style={styles.refreshText}>
                {facing === 'front' ? 'Selfie' : 'Belakang'}
              </Text>
            </Pressable>
          )}
        </View>

        {!cameraPermission?.granted ? (
          <View style={styles.permBox}>
            <Text style={styles.gpsSub}>Kamera diperlukan untuk mengambil foto langsung.</Text>
            <Pressable style={styles.permBtn} onPress={requestCameraPermission}>
              <Text style={styles.permBtnText}>Izinkan Kamera</Text>
            </Pressable>
          </View>
        ) : photoUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: photoUri }} style={styles.previewImg} />
            <Pressable style={styles.retakeBtn} onPress={() => setPhotoUri(null)}>
              <Ionicons name="refresh" size={16} color="#0f172a" />
              <Text style={styles.retakeText}>Ambil Ulang Foto</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
            <Pressable
              style={styles.captureBtn}
              onPress={handleTakePhoto}
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="camera" size={20} color="#ffffff" />
                  <Text style={styles.captureText}>Ambil Foto</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <Pressable
        style={[styles.submitBtn, (submitting || gpsLoading) && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting || gpsLoading}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="checkmark-done" size={20} color="#fde68a" />
            <Text style={styles.submitText}>Kirim Presensi Hadir</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 16, paddingBottom: 36 },
  infoCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
  infoTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  infoSub: { color: '#d1fae5', fontSize: 12, marginTop: 6 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: { fontSize: 12, fontWeight: '700', color: '#065f46' },
  gpsWait: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  gpsSub: { fontSize: 13, color: '#64748b' },
  errorText: { fontSize: 13, color: '#b91c1c', marginTop: 8 },
  coordText: { fontSize: 13, color: '#334155', fontFamily: 'SpaceMono' },
  radiusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  radiusBadgeOut: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  radiusText: { fontSize: 12, fontWeight: '700', color: '#065f46', flex: 1 },
  radiusTextOut: { color: '#b91c1c' },
  permBox: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  permBtn: {
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  permBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  cameraWrap: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  camera: { width: '100%', height: 280 },
  captureBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#d97706',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  previewWrap: { marginTop: 12 },
  previewImg: { width: '100%', height: 280, borderRadius: 12 },
  retakeBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  retakeText: { fontWeight: '700', color: '#0f172a', fontSize: 13 },
  submitBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#065f46',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
