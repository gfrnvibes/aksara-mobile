import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  apiRequest,
  KelasOption,
  PresensiOpsiResponse,
  PresensiSheetResponse,
  PresensiSiswaRow,
} from '@/src/lib/api';

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function PresensiScreen() {
  const [tanggal, setTanggal] = useState(todayIso);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [statusOpsi, setStatusOpsi] = useState<Record<string, string>>({
    hadir: 'Hadir',
    sakit: 'Sakit',
    izin: 'Izin',
    alpa: 'Alpa',
  });
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);
  const [versi, setVersi] = useState('');
  const [rows, setRows] = useState<PresensiSiswaRow[]>([]);
  const [alasan, setAlasan] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSheet = useCallback(async (kelasId: number, tgl: string) => {
    try {
      setError(null);
      const sheet = await apiRequest<PresensiSheetResponse>(
        `/guru/presensi?kelas_id=${kelasId}&tanggal=${encodeURIComponent(tgl)}`,
      );
      setVersi(sheet.versi);
      setRows(
        sheet.siswa.map((s) => ({
          ...s,
          status: s.status ?? 'hadir',
        })),
      );
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar siswa.');
    }
  }, []);

  const loadOpsi = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const opsi = await apiRequest<PresensiOpsiResponse>(
        `/guru/presensi/opsi?tanggal=${encodeURIComponent(tanggal)}`,
      );
      setKelasList(opsi.kelas);
      setStatusOpsi(opsi.status_opsi);
      const nextKelas =
        opsi.kelas.find((k) => k.id === selectedKelasId)?.id ?? opsi.kelas[0]?.id ?? null;
      setSelectedKelasId(nextKelas);
      if (nextKelas !== null) {
        await loadSheet(nextKelas, tanggal);
      } else {
        setRows([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat opsi kelas.');
    } finally {
      setLoading(false);
    }
  }, [tanggal, selectedKelasId, loadSheet]);

  useEffect(() => {
    loadOpsi();
  }, [loadOpsi]);

  function updateStatus(siswaId: number, status: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.siswa_id === siswaId
          ? { ...row, status, terlambat_menit: status === 'hadir' ? row.terlambat_menit : 0 }
          : row,
      ),
    );
  }

  async function handleSave() {
    if (selectedKelasId === null || rows.length === 0) return;

    setSaving(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string; versi: string }>('/guru/presensi', {
        method: 'POST',
        body: {
          kelas_id: selectedKelasId,
          tanggal,
          versi,
          alasan: alasan.trim() || null,
          baris: rows.map((r) => ({
            siswa_id: r.siswa_id,
            status: r.status ?? 'hadir',
            terlambat_menit: r.terlambat_menit ?? 0,
            catatan: r.catatan ?? null,
          })),
        },
      });
      setVersi(res.versi);
      setAlasan('');
      Alert.alert('Berhasil', res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan presensi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOpsi} />}
    >
      <View style={styles.filterCard}>
        <Text style={styles.label}>Tanggal (YYYY-MM-DD)</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            value={tanggal}
            onChangeText={setTanggal}
            placeholder="2026-11-21"
          />
          <Pressable style={styles.reloadBtn} onPress={loadOpsi}>
            <Text style={styles.reloadBtnText}>Muat</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Pilih Kelas</Text>
        {kelasList.length === 0 ? (
          <Text style={styles.helperText}>
            Anda bukan wali kelas atau petugas piket pada tanggal ini.
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {kelasList.map((k) => {
              const active = k.id === selectedKelasId;
              return (
                <Pressable
                  key={k.id}
                  style={[styles.kelasPill, active && styles.kelasPillActive]}
                  onPress={() => {
                    setSelectedKelasId(k.id);
                    loadSheet(k.id, tanggal);
                  }}
                >
                  <Text style={[styles.kelasPillText, active && styles.kelasPillTextActive]}>
                    {k.nama}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0f766e" style={styles.loader} />
      ) : (
        rows.map((row) => (
          <View key={row.siswa_id} style={styles.studentCard}>
            <Text style={styles.studentName}>{row.nama}</Text>
            {row.nis && <Text style={styles.studentNis}>NIS {row.nis}</Text>}
            <View style={styles.statusRow}>
              {Object.entries(statusOpsi).map(([key, label]) => {
                const active = row.status === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.statusBtn, active && styles.statusBtnActive]}
                    onPress={() => updateStatus(row.siswa_id, key)}
                  >
                    <Text style={[styles.statusBtnText, active && styles.statusBtnTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}

      {rows.length > 0 && (
        <View style={styles.saveCard}>
          <Text style={styles.label}>Alasan koreksi / tanggal lampau (jika ada)</Text>
          <TextInput
            style={styles.input}
            value={alasan}
            onChangeText={setAlasan}
            placeholder="Opsional untuk presensi baru hari ini"
          />
          <Pressable
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Simpan Presensi ({rows.length} siswa)</Text>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
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
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  dateInput: { flex: 1 },
  reloadBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  reloadBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  helperText: { fontSize: 13, color: '#64748b' },
  kelasPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginRight: 8,
  },
  kelasPillActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  kelasPillText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  kelasPillTextActive: { color: '#ffffff' },
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
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  studentName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  studentNis: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 10 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  statusBtnActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  statusBtnText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  statusBtnTextActive: { color: '#ffffff' },
  saveCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
