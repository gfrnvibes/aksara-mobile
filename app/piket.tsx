import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedCard } from '@/src/components/AnimatedCard';
import { apiRequest, getToken, KehadiranGtkResponse, PiketResponse } from '@/src/lib/api';

export default function PiketScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'gtk' | 'piket'>('gtk');
  const [gtkData, setGtkData] = useState<KehadiranGtkResponse | null>(null);
  const [piketData, setPiketData] = useState<PiketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<KehadiranGtkResponse['riwayat'][number] | null>(null);

  const [showPiketModal, setShowPiketModal] = useState(false);
  const [jenis, setJenis] = useState('keterlambatan');
  const [kejadian, setKejadian] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gtk, token] = await Promise.all([
        apiRequest<KehadiranGtkResponse>('/guru/kehadiran-gtk'),
        getToken(),
      ]);
      setGtkData(gtk);
      setAuthToken(token);
      try {
        const piket = await apiRequest<PiketResponse>('/guru/piket');
        setPiketData(piket);
        const firstJenis = Object.keys(piket.jenis_opsi)[0];
        if (firstJenis) setJenis(firstJenis);
      } catch {
        setPiketData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleHadir() {
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string }>('/guru/kehadiran-gtk/hadir', {
        method: 'POST',
      });
      Alert.alert('Berhasil', res.message);
      await loadAll();
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal mencatat kehadiran.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePiket() {
    if (!kejadian.trim() || !piketData) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string }>('/guru/piket', {
        method: 'POST',
        body: {
          tanggal: piketData.tanggal,
          jenis,
          kejadian: kejadian.trim(),
          tindak_lanjut: tindakLanjut.trim() || null,
        },
      });
      setShowPiketModal(false);
      setKejadian('');
      setTindakLanjut('');
      Alert.alert('Berhasil', res.message);
      await loadAll();
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal mencatat kejadian.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabBtn, tab === 'gtk' && styles.tabBtnActive]}
          onPress={() => setTab('gtk')}
        >
          <Text style={[styles.tabText, tab === 'gtk' && styles.tabTextActive]}>Kehadiran GTK</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === 'piket' && styles.tabBtnActive]}
          onPress={() => setTab('piket')}
        >
          <Text style={[styles.tabText, tab === 'piket' && styles.tabTextActive]}>Buku Piket</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#065f46" style={{ marginTop: 32 }} />
      ) : tab === 'gtk' ? (
        <>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/presensi-lokasi')}>
            <Ionicons name="camera-outline" size={20} color="#ffffff" />
            <Text style={styles.primaryText}>Presensi Lokasi & Foto Hari Ini</Text>
          </Pressable>

          {gtkData?.riwayat.map((item, idx) => (
            <AnimatedCard key={item.id} index={idx} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.name}>{item.gtk_nama}</Text>
                <Text style={styles.badge}>{item.status_label}</Text>
              </View>
              <Text style={styles.meta}>
                {item.tanggal} {item.waktu ? `· ${item.waktu}` : ''}
                {item.jarak_meter !== null && item.jarak_meter !== undefined ? ` · Jarak ${item.jarak_meter} m` : ''}
              </Text>
              {item.catatan && <Text style={styles.note}>{item.catatan}</Text>}
              {item.foto_url && (
                <Pressable style={styles.fotoBtn} onPress={() => setPreviewItem(item)}>
                  <Ionicons name="image-outline" size={15} color="#065f46" />
                  <Text style={styles.fotoBtnText}>Lihat Foto</Text>
                </Pressable>
              )}
            </AnimatedCard>
          ))}
        </>
      ) : piketData === null ? (
        <View style={styles.emptyCard}>
          <Ionicons name="shield-outline" size={28} color="#d97706" />
          <Text style={styles.emptyText}>Buku Piket hanya tersedia untuk petugas piket terjadwal.</Text>
        </View>
      ) : (
        <>
          <Pressable style={styles.primaryBtn} onPress={() => setShowPiketModal(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
            <Text style={styles.primaryText}>Catat Kejadian Piket</Text>
          </Pressable>

          {piketData.catatan.map((c, idx) => (
            <AnimatedCard key={c.id} index={idx} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.name}>{c.jenis_label}</Text>
                <Text style={styles.meta}>{c.tanggal}</Text>
              </View>
              <Text style={styles.note}>{c.kejadian}</Text>
              {c.tindak_lanjut && <Text style={styles.meta}>Tindak lanjut: {c.tindak_lanjut}</Text>}
            </AnimatedCard>
          ))}
        </>
      )}

      <Modal visible={showPiketModal} animationType="slide" onRequestClose={() => setShowPiketModal(false)}>
        <ScrollView style={styles.modalContainer} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Catat Kejadian Piket</Text>
          <Text style={styles.label}>Jenis Kejadian</Text>
          <View style={styles.wrapRow}>
            {piketData &&
              Object.entries(piketData.jenis_opsi).map(([val, label]) => {
                const active = val === jenis;
                return (
                  <Pressable
                    key={val}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setJenis(val)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
          </View>
          <Text style={styles.label}>Kejadian</Text>
          <TextInput
            style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
            multiline
            value={kejadian}
            onChangeText={setKejadian}
            placeholder="Uraikan kejadian secara singkat"
          />
          <Text style={styles.label}>Tindak Lanjut (opsional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
            multiline
            value={tindakLanjut}
            onChangeText={setTindakLanjut}
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setShowPiketModal(false)}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSavePiket} disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
            </Pressable>
          </View>
          <Modal visible={previewItem !== null} animationType="fade" transparent onRequestClose={() => setPreviewItem(null)}>
        <View style={styles.fotoModalOverlay}>
          <View style={styles.fotoModalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Foto Bukti Presensi</Text>
              <Pressable onPress={() => setPreviewItem(null)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            {previewItem?.foto_url && (
              <Image
                source={{
                  uri: previewItem.foto_url,
                  headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
                }}
                style={styles.fotoPreviewImg}
                resizeMode="contain"
              />
            )}
            {previewItem && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.name}>{previewItem.gtk_nama}</Text>
                <Text style={styles.meta}>
                  {previewItem.waktu ?? previewItem.tanggal}
                  {previewItem.jarak_meter !== null && previewItem.jarak_meter !== undefined
                    ? ` · Jarak ${previewItem.jarak_meter} m`
                    : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
      </Modal>
      <Modal visible={previewItem !== null} animationType="fade" transparent onRequestClose={() => setPreviewItem(null)}>
        <View style={styles.fotoModalOverlay}>
          <View style={styles.fotoModalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Foto Bukti Presensi</Text>
              <Pressable onPress={() => setPreviewItem(null)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            {previewItem?.foto_url && (
              <Image
                source={{
                  uri: previewItem.foto_url,
                  headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
                }}
                style={styles.fotoPreviewImg}
                resizeMode="contain"
              />
            )}
            {previewItem && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.name}>{previewItem.gtk_nama}</Text>
                <Text style={styles.meta}>
                  {previewItem.waktu ?? previewItem.tanggal}
                  {previewItem.jarak_meter !== null && previewItem.jarak_meter !== undefined
                    ? ` · Jarak ${previewItem.jarak_meter} m`
                    : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 16, paddingBottom: 32 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#065f46', borderColor: '#065f46' },
  tabText: { fontWeight: '700', color: '#334155', fontSize: 13 },
  tabTextActive: { color: '#ffffff' },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#065f46',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  badge: { fontSize: 12, fontWeight: '700', color: '#065f46' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  note: { fontSize: 13, color: '#1e293b', marginTop: 6 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  pillActive: { backgroundColor: '#065f46', borderColor: '#065f46' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  pillTextActive: { color: '#ffffff' },
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
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: '#334155' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveText: { fontWeight: '700', color: '#ffffff' },
  fotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fotoBtnText: { fontSize: 12, fontWeight: '700', color: '#065f46' },
  fotoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  fotoModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
  },
  fotoPreviewImg: {
    width: '100%',
    height: 360,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
});
