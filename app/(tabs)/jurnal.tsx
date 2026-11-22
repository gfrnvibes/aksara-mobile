import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DatePickerField } from '@/src/components/DatePickerField';
import { SwipeTabScreen } from '@/src/components/SwipeTabScreen';
import { TabHeader } from '@/src/components/TabHeader';
import { useAuth } from '@/src/context/AuthContext';
import { apiRequest, JurnalListResponse, PertemuanItem } from '@/src/lib/api';

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function JurnalScreen() {
  const { user } = useAuth();
  const [tanggal, setTanggal] = useState(todayIso);
  const [pertemuan, setPertemuan] = useState<PertemuanItem[]>([]);
  const [statusOpsi, setStatusOpsi] = useState<Record<string, string>>({
    terlaksana: 'Terlaksana',
    kegiatan_pengganti: 'Kegiatan pengganti',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<PertemuanItem | null>(null);
  const [geminiAktif, setGeminiAktif] = useState(false);
  const [catatanAsli, setCatatanAsli] = useState('');
  const [dibantuAi, setDibantuAi] = useState(false);
  const [rapikanLoading, setRapikanLoading] = useState(false);
  const [status, setStatus] = useState('terlaksana');
  const [materi, setMateri] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [refleksi, setRefleksi] = useState('');
  const [alasan, setAlasan] = useState('');

  const loadJurnal = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const res = await apiRequest<JurnalListResponse>(
        `/guru/jurnal?tanggal=${encodeURIComponent(tanggal)}`,
      );
      setPertemuan(res.pertemuan);
      setStatusOpsi(res.status_opsi);
      setGeminiAktif(Boolean(res.gemini_aktif));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat jurnal mengajar.');
    } finally {
      setLoading(false);
    }
  }, [tanggal]);

  useEffect(() => {
    loadJurnal();
  }, [loadJurnal]);

  async function handleHadir(item: PertemuanItem) {
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string }>('/guru/jurnal/hadir', {
        method: 'POST',
        body: { tanggal, sumber_jadwal: item.sumber_jadwal },
      });
      Alert.alert('Berhasil', res.message);
      await loadJurnal();
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal mencatat kehadiran.');
    } finally {
      setSaving(false);
    }
  }

  function openEditor(item: PertemuanItem) {
    setEditing(item);
    setStatus(
      item.status === 'belum_dicatat' || item.status === 'hadir' ? 'terlaksana' : item.status,
    );
    setCatatanAsli('');
    setDibantuAi(false);
    setMateri(item.materi ?? '');
    setKegiatan(item.kegiatan ?? '');
    setRefleksi(item.refleksi ?? '');
    setAlasan(item.alasan ?? '');
  }

  async function handleRapikanAi() {
    if (!editing || !catatanAsli.trim()) {
      Alert.alert('Perhatian', 'Isi catatan singkat Anda terlebih dahulu.');
      return;
    }
    setRapikanLoading(true);
    try {
      const res = await apiRequest<{
        draf: { materi?: string; kegiatan?: string; refleksi?: string; tindak_lanjut?: string };
      }>('/guru/jurnal/rapikan', {
        method: 'POST',
        body: {
          tanggal,
          sumber_jadwal: editing.sumber_jadwal,
          catatan_asli: catatanAsli.trim(),
        },
      });
      if (res.draf.materi) setMateri(res.draf.materi);
      if (res.draf.kegiatan) setKegiatan(res.draf.kegiatan);
      if (res.draf.refleksi) setRefleksi(res.draf.refleksi);
      setDibantuAi(true);
      Alert.alert('Draf AI Siap', 'Periksa dan sesuaikan isi jurnal sebelum menyimpan.');
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal merapikan dengan Gemini.');
    } finally {
      setRapikanLoading(false);
    }
  }

  async function handleSaveJurnal() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string }>('/guru/jurnal', {
        method: 'POST',
        body: {
          tanggal,
          sumber_jadwal: editing.sumber_jadwal,
          status,
          catatan_asli: catatanAsli.trim() || null,
          materi: materi.trim() || null,
          kegiatan: kegiatan.trim() || null,
          refleksi: refleksi.trim() || null,
          alasan: alasan.trim() || null,
          dibantu_ai: dibantuAi,
        },
      });
      setEditing(null);
      Alert.alert('Berhasil', res.message);
      await loadJurnal();
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal menyimpan jurnal.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SwipeTabScreen current="jurnal">
      <TabHeader title="Jurnal Mengajar" subtitle="Catat kehadiran mengajar & materi pembelajaran" />
      <ScrollView
        style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadJurnal} />}
    >
      <View style={styles.filterCard}>
        <Text style={styles.label}>Tanggal Pertemuan</Text>
        <View style={styles.dateRow}>
          <DatePickerField
            value={tanggal}
            maximumDate={new Date()}
            onChange={setTanggal}
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0f766e" style={styles.loader} />
      ) : pertemuan.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Tidak Ada Pertemuan</Text>
          <Text style={styles.emptyText}>Tidak ada pertemuan mengajar pada tanggal ini.</Text>
        </View>
      ) : (
        pertemuan.map((item) => (
          <View key={item.sumber_jadwal} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.jpBadge}>
                JP {item.jp_mulai}–{item.jp_selesai}
              </Text>
              <Text style={styles.statusTag}>{item.status.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.mapelTitle}>{item.nama_mapel}</Text>
            <Text style={styles.metaText}>
              Kelas {item.nama_kelas} · {item.waktu ?? 'Jam belum diatur'}
            </Text>
            {item.materi && <Text style={styles.materiText}>Materi: {item.materi}</Text>}

            <View style={styles.actionRow}>
              {item.status === 'belum_dicatat' && item.guru_id === user?.gtk?.id && (
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => handleHadir(item)}
                  disabled={saving}
                >
                  <Text style={styles.secondaryBtnText}>Hadir Mengajar</Text>
                </Pressable>
              )}
              <Pressable style={styles.primaryBtn} onPress={() => openEditor(item)}>
                <Text style={styles.primaryBtnText}>Isi / Koreksi Jurnal</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Modal visible={editing !== null} animationType="slide" onRequestClose={() => setEditing(null)}>
        <ScrollView style={styles.modalContainer} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editing?.nama_mapel} · Kelas {editing?.nama_kelas}
          </Text>

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {Object.entries(statusOpsi).map(([key, label]) => {
              const active = status === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.statusPill, active && styles.statusPillActive]}
                  onPress={() => setStatus(key)}
                >
                  <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Catatan Singkat Anda</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={catatanAsli}
            onChangeText={setCatatanAsli}
            multiline
            placeholder="Tuliskan yang benar-benar dilaksanakan di kelas"
          />
          {geminiAktif && (
            <Pressable style={styles.aiBtn} onPress={handleRapikanAi} disabled={rapikanLoading}>
              <Ionicons name="sparkles" size={16} color="#ffffff" />
              <Text style={styles.aiBtnText}>
                {rapikanLoading ? 'Merapikan dengan Gemini...' : 'Rapikan dengan Gemini'}
              </Text>
            </Pressable>
          )}

          <Text style={styles.label}>Materi</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={materi}
            onChangeText={setMateri}
            multiline
            placeholder="Tuliskan materi pokok yang diajarkan"
          />

          <Text style={styles.label}>Kegiatan Pembelajaran</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={kegiatan}
            onChangeText={setKegiatan}
            multiline
            placeholder="Ringkasan kegiatan di kelas"
          />

          <Text style={styles.label}>Refleksi</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={refleksi}
            onChangeText={setRefleksi}
            multiline
            placeholder="Catatan refleksi (opsional)"
          />

          <Text style={styles.label}>Alasan koreksi / tanggal lampau</Text>
          <TextInput
            style={styles.input}
            value={alasan}
            onChangeText={setAlasan}
            placeholder="Wajib jika tanggal lampau atau kegiatan pengganti"
          />

          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setEditing(null)}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSaveJurnal} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Menyimpan...' : 'Simpan Jurnal'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
    </SwipeTabScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 32 },
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  dateRow: { flexDirection: 'row', gap: 8 },
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
  dateInput: { flex: 1, marginBottom: 0 },
  reloadBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  reloadBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
  loader: { marginTop: 32 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  jpBadge: {
    backgroundColor: '#ccfbf1',
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTag: { fontSize: 12, fontWeight: '600', color: '#475569', textTransform: 'capitalize' },
  mapelTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  metaText: { fontSize: 13, color: '#475569', marginTop: 3 },
  materiText: { fontSize: 13, color: '#0f172a', marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#0f766e',
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  statusPillActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  statusPillText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  statusPillTextActive: { color: '#ffffff' },
  textArea: { minHeight: 84, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '700', color: '#334155' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: { fontWeight: '700', color: '#ffffff' },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d97706',
    borderRadius: 10,
    paddingVertical: 11,
    marginBottom: 14,
  },
  aiBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
});
