import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedCard } from '@/src/components/AnimatedCard';
import { apiRequest, NilaiOpsiResponse, RaporResponse } from '@/src/lib/api';

export default function RaporScreen() {
  const [opsi, setOpsi] = useState<NilaiOpsiResponse | null>(null);
  const [kelasId, setKelasId] = useState<number | null>(null);
  const [semester, setSemester] = useState<number>(1);
  const [data, setData] = useState<RaporResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RaporResponse['rapor'][number] | null>(null);
  const [sakit, setSakit] = useState('0');
  const [izin, setIzin] = useState('0');
  const [alpa, setAlpa] = useState('0');
  const [catatan, setCatatan] = useState('');
  const [keputusan, setKeputusan] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest<NilaiOpsiResponse>('/guru/nilai/opsi')
      .then((res) => {
        setOpsi(res);
        setSemester(res.semester_aktif);
        setKelasId(res.kelas_perwalian[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadRapor = useCallback(async () => {
    if (!opsi?.tahun_ajaran_aktif_id || !kelasId) return;
    setLoading(true);
    try {
      const res = await apiRequest<RaporResponse>(
        `/guru/rapor?kelas_id=${kelasId}&tahun_ajaran_id=${opsi.tahun_ajaran_aktif_id}&semester=${semester}`,
      );
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [opsi, kelasId, semester]);

  useEffect(() => {
    loadRapor();
  }, [loadRapor]);

  function openEdit(item: RaporResponse['rapor'][number]) {
    setEditing(item);
    setSakit(String(item.sakit ?? 0));
    setIzin(String(item.izin ?? 0));
    setAlpa(String(item.tanpa_keterangan ?? 0));
    setCatatan(item.catatan ?? '');
    setKeputusan(item.keputusan);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string }>(`/guru/rapor/${editing.id}`, {
        method: 'POST',
        body: {
          sakit: Number(sakit) || 0,
          izin: Number(izin) || 0,
          tanpa_keterangan: Number(alpa) || 0,
          catatan: catatan.trim() || null,
          keputusan,
        },
      });
      setEditing(null);
      Alert.alert('Berhasil', res.message);
      await loadRapor();
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal menyimpan rapor.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {opsi && opsi.kelas_perwalian.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="information-circle-outline" size={28} color="#d97706" />
          <Text style={styles.emptyText}>Menu Rapor Kelas hanya tersedia untuk Wali Kelas.</Text>
        </View>
      ) : (
        <>
          <View style={styles.filterCard}>
            <Text style={styles.label}>Kelas Perwalian</Text>
            <View style={styles.row}>
              {opsi?.kelas_perwalian.map((k) => {
                const active = k.id === kelasId;
                return (
                  <Pressable
                    key={k.id}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setKelasId(k.id)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{k.nama}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.label}>Semester</Text>
            <View style={styles.row}>
              {opsi &&
                Object.entries(opsi.semester_opsi).map(([val, label]) => {
                  const active = Number(val) === semester;
                  return (
                    <Pressable
                      key={val}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setSemester(Number(val))}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#065f46" style={{ marginTop: 24 }} />
          ) : data && data.rapor.length > 0 ? (
            data.rapor.map((item, idx) => (
              <AnimatedCard
                key={item.id}
                index={idx}
                style={styles.card}
                onPress={() => openEdit(item)}
              >
                <Text style={styles.name}>{item.nama}</Text>
                <Text style={styles.meta}>
                  S: {item.sakit} · I: {item.izin} · A: {item.tanpa_keterangan}
                  {item.keputusan_label ? ` · ${item.keputusan_label}` : ''}
                </Text>
                {item.catatan && <Text style={styles.note}>{item.catatan}</Text>}
              </AnimatedCard>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Belum ada data rapor pada semester ini.</Text>
            </View>
          )}
        </>
      )}

      <Modal visible={editing !== null} animationType="slide" onRequestClose={() => setEditing(null)}>
        <ScrollView style={styles.modalContainer} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>{editing?.nama}</Text>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Sakit</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={sakit} onChangeText={setSakit} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Izin</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={izin} onChangeText={setIzin} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Alpa</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={alpa} onChangeText={setAlpa} />
            </View>
          </View>

          <Text style={styles.label}>Keputusan Kenaikan / Kelulusan</Text>
          <View style={styles.row}>
            {data &&
              Object.entries(data.keputusan_opsi).map(([val, label]) => {
                const active = keputusan === val;
                return (
                  <Pressable
                    key={val}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => setKeputusan(val)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
          </View>

          <Text style={styles.label}>Catatan Wali Kelas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={catatan}
            onChangeText={setCatatan}
            placeholder="Catatan motivasi dan perkembangan siswa"
          />

          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setEditing(null)}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 16, paddingBottom: 32 },
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  col: { flex: 1 },
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 13, color: '#475569', marginTop: 3 },
  note: { fontSize: 13, color: '#065f46', marginTop: 6 },
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
  textArea: { minHeight: 90, textAlignVertical: 'top' },
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
});
