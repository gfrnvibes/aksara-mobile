import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { apiRequest, NilaiOpsiResponse, NilaiSheetResponse } from '@/src/lib/api';

export default function NilaiScreen() {
  const [opsi, setOpsi] = useState<NilaiOpsiResponse | null>(null);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [semester, setSemester] = useState<number>(1);
  const [kelasId, setKelasId] = useState<number | null>(null);
  const [mapelId, setMapelId] = useState<number | null>(null);
  const [sheet, setSheet] = useState<NilaiSheetResponse | null>(null);
  const [kkm, setKkm] = useState('75');
  const [rows, setRows] = useState<NilaiSheetResponse['siswa']>([]);
  const [materiCapaian, setMateriCapaian] = useState('');
  const [generatingCapaian, setGeneratingCapaian] = useState(false);
  const [editingSiswaId, setEditingSiswaId] = useState<number | null>(null);
  const [draftCapaian, setDraftCapaian] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOpsi = useCallback(async () => {
    try {
      const res = await apiRequest<NilaiOpsiResponse>('/guru/nilai/opsi');
      setOpsi(res);
      setSemester(res.semester_aktif);
      const first =
        res.penugasan.find((p) => p.tahun_ajaran_id === res.tahun_ajaran_aktif_id) ??
        res.penugasan[0];
      if (first) {
        setTahunId(first.tahun_ajaran_id);
        setKelasId(first.kelas_id);
        setMapelId(first.mata_pelajaran_id);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOpsi();
  }, [loadOpsi]);

  const loadSheet = useCallback(async () => {
    if (!tahunId || !kelasId || !mapelId) return;
    setLoading(true);
    try {
      const res = await apiRequest<NilaiSheetResponse>(
        `/guru/nilai?tahun_ajaran_id=${tahunId}&semester=${semester}&kelas_id=${kelasId}&mata_pelajaran_id=${mapelId}`,
      );
      setSheet(res);
      setKkm(String(res.kkm));
      setRows(res.siswa);
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal memuat daftar nilai.');
    } finally {
      setLoading(false);
    }
  }, [tahunId, semester, kelasId, mapelId]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  const kelasOptions = useMemo(() => {
    if (!opsi || !tahunId) return [];
    const seen = new Map<number, string>();
    opsi.penugasan
      .filter((p) => p.tahun_ajaran_id === tahunId)
      .forEach((p) => seen.set(p.kelas_id, p.kelas));
    return Array.from(seen.entries()).map(([id, nama]) => ({ id, nama }));
  }, [opsi, tahunId]);

  const mapelOptions = useMemo(() => {
    if (!opsi || !tahunId || !kelasId) return [];
    const seen = new Map<number, string>();
    opsi.penugasan
      .filter((p) => p.tahun_ajaran_id === tahunId && p.kelas_id === kelasId)
      .forEach((p) => seen.set(p.mata_pelajaran_id, p.mapel));
    return Array.from(seen.entries()).map(([id, nama]) => ({ id, nama }));
  }, [opsi, tahunId, kelasId]);

  const editingStudent = useMemo(
    () => rows.find((r) => r.siswa_id === editingSiswaId) ?? null,
    [rows, editingSiswaId],
  );

  function updateField(siswaId: number, field: string, value: string) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.siswa_id !== siswaId) return row;
        if (field === 'capaian_kompetensi') {
          return { ...row, capaian_kompetensi: value };
        }
        const num = value.trim() === '' ? null : Math.min(100, Math.max(0, Number(value) || 0));
        return { ...row, [field]: num };
      }),
    );
  }

  function openCapaianModal(siswa: NilaiSheetResponse['siswa'][number]) {
    setEditingSiswaId(siswa.siswa_id);
    setDraftCapaian(siswa.capaian_kompetensi ?? '');
  }

  function saveCapaianModal(nextStudent?: boolean) {
    if (editingSiswaId === null) return;
    const currentIdx = rows.findIndex((r) => r.siswa_id === editingSiswaId);
    updateField(editingSiswaId, 'capaian_kompetensi', draftCapaian);

    if (nextStudent && currentIdx >= 0 && currentIdx + 1 < rows.length) {
      const next = rows[currentIdx + 1];
      setEditingSiswaId(next.siswa_id);
      setDraftCapaian(next.capaian_kompetensi ?? '');
      return;
    }

    setEditingSiswaId(null);
  }

  async function handleGenerateCapaian(timpa = false) {
    if (!tahunId || !kelasId || !mapelId || rows.length === 0) return;
    setGeneratingCapaian(true);
    try {
      const res = await apiRequest<{
        sumber: string;
        alasan_gagal_ai: string | null;
        capaian: Record<string, string>;
      }>('/guru/nilai/buat-capaian', {
        method: 'POST',
        body: {
          tahun_ajaran_id: tahunId,
          semester,
          kelas_id: kelasId,
          mata_pelajaran_id: mapelId,
          kkm: Number(kkm) || 75,
          materi: materiCapaian.trim() || null,
          timpa,
          baris: rows.map((r) => ({
            siswa_id: r.siswa_id,
            nilai_akhir: r.nilai_akhir,
            capaian_kompetensi: r.capaian_kompetensi,
            terkunci: r.terkunci,
          })),
        },
      });
      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          capaian_kompetensi: res.capaian[String(row.siswa_id)] ?? row.capaian_kompetensi,
        })),
      );
      const jumlah = Object.keys(res.capaian).length;
      Alert.alert(
        `Capaian ${jumlah} siswa dibuat`,
        res.alasan_gagal_ai
          ? `Gemini tidak tersedia (${res.alasan_gagal_ai}), disusun dari aturan. Periksa sebelum menyimpan.`
          : 'Periksa dan sesuaikan capaian kompetensi sebelum menyimpan.',
      );
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal membuat capaian otomatis.');
    } finally {
      setGeneratingCapaian(false);
    }
  }

  async function handleSave() {
    if (!tahunId || !kelasId || !mapelId || rows.length === 0) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string }>('/guru/nilai', {
        method: 'POST',
        body: {
          tahun_ajaran_id: tahunId,
          semester,
          kelas_id: kelasId,
          mata_pelajaran_id: mapelId,
          kkm: Number(kkm) || 75,
          baris: rows,
        },
      });
      Alert.alert('Berhasil', res.message);
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal menyimpan nilai.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.filterCard}>
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

        <Text style={styles.label}>Kelas Mengajar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {kelasOptions.map((k) => {
            const active = k.id === kelasId;
            return (
              <Pressable
                key={k.id}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => {
                  setKelasId(k.id);
                  const firstMapel = opsi?.penugasan.find(
                    (p) => p.tahun_ajaran_id === tahunId && p.kelas_id === k.id,
                  );
                  if (firstMapel) setMapelId(firstMapel.mata_pelajaran_id);
                }}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{k.nama}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Mata Pelajaran</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {mapelOptions.map((m) => {
            const active = m.id === mapelId;
            return (
              <Pressable
                key={m.id}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setMapelId(m.id)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{m.nama}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>KKM</Text>
        <TextInput style={styles.input} value={kkm} onChangeText={setKkm} keyboardType="numeric" />

        {sheet?.pakai_capaian && (
          <View style={styles.aiBox}>
            <Text style={styles.label}>Materi Pembelajaran (opsional untuk AI)</Text>
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              value={materiCapaian}
              onChangeText={setMateriCapaian}
              placeholder="Contoh: operasi bilangan bulat dan pecahan"
            />
            <Pressable
              style={styles.aiBtn}
              onPress={() => handleGenerateCapaian(false)}
              disabled={generatingCapaian}
            >
              <Ionicons name="sparkles" size={16} color="#ffffff" />
              <Text style={styles.aiBtnText}>
                {generatingCapaian ? 'Menyusun Capaian...' : 'Buat Capaian Otomatis (AI)'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#065f46" style={{ marginTop: 32 }} />
      ) : rows.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="school-outline" size={28} color="#d97706" />
          <Text style={styles.emptyText}>Belum ada siswa atau penugasan mengajar pada kelas ini.</Text>
        </View>
      ) : (
        <>
          <View style={styles.studentGrid}>
            {rows.map((s, idx) => {
              const hasCapaian = Boolean(s.capaian_kompetensi && s.capaian_kompetensi.trim() !== '');
              return (
                <AnimatedCard key={s.siswa_id} index={idx} style={styles.gridCard}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {s.nama}
                  </Text>
                  <Text style={styles.studentNis} numberOfLines={1}>
                    {s.nis ? `NIS ${s.nis}` : '—'}
                  </Text>

                  <View style={styles.scoreGrid}>
                    {sheet &&
                      Object.entries(sheet.kolom_nilai).map(([col, label]) => {
                        const currentVal = (s as Record<string, unknown>)[col];
                        return (
                          <View key={col} style={styles.scoreCol}>
                            <Text style={styles.scoreLabel} numberOfLines={1}>
                              {label}
                            </Text>
                            <TextInput
                              style={styles.scoreInput}
                              keyboardType="numeric"
                              value={
                                currentVal === null || currentVal === undefined
                                  ? ''
                                  : String(currentVal)
                              }
                              onChangeText={(v) => updateField(s.siswa_id, col, v)}
                              placeholder="0–100"
                              editable={!s.terkunci}
                            />
                          </View>
                        );
                      })}
                  </View>

                  <Pressable
                    style={[styles.capaianChip, hasCapaian && styles.capaianChipFilled]}
                    onPress={() => openCapaianModal(s)}
                  >
                    <Ionicons
                      name={hasCapaian ? 'checkmark-circle' : 'create-outline'}
                      size={14}
                      color={hasCapaian ? '#065f46' : '#b45309'}
                    />
                    <Text
                      style={[styles.capaianChipText, hasCapaian && styles.capaianChipTextFilled]}
                      numberOfLines={1}
                    >
                      {hasCapaian ? 'Capaian terisi' : 'Isi capaian'}
                    </Text>
                  </Pressable>
                </AnimatedCard>
              );
            })}
          </View>

          {sheet?.pakai_capaian && (
            <Pressable
              style={[styles.aiBtn, { marginTop: 10, marginBottom: 4 }]}
              onPress={() => handleGenerateCapaian(false)}
              disabled={generatingCapaian}
            >
              <Ionicons name="sparkles" size={16} color="#ffffff" />
              <Text style={styles.aiBtnText}>
                {generatingCapaian ? 'Menyusun Capaian...' : 'Buat Capaian Otomatis (AI)'}
              </Text>
            </Pressable>
          )}

          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>
              {saving ? 'Menyimpan...' : `Simpan Nilai (${rows.length} siswa)`}
            </Text>
          </Pressable>
        </>
      )}

      <Modal
        visible={editingStudent !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingSiswaId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {editingStudent?.nama}
                </Text>
                <Text style={styles.modalSub}>
                  {editingStudent?.nis ? `NIS ${editingStudent.nis}` : ''}
                  {editingStudent?.nilai_akhir !== null && editingStudent?.nilai_akhir !== undefined
                    ? ` · Nilai Akhir: ${editingStudent.nilai_akhir}`
                    : ''}
                </Text>
              </View>
              <Pressable onPress={() => setEditingSiswaId(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#64748b" />
              </Pressable>
            </View>

            <Text style={styles.label}>Deskripsi Capaian Kompetensi</Text>
            <TextInput
              style={styles.modalTextArea}
              multiline
              autoFocus
              value={draftCapaian}
              onChangeText={setDraftCapaian}
              placeholder="Tuliskan capaian kompetensi siswa pada mata pelajaran ini..."
              editable={!editingStudent?.terkunci}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => saveCapaianModal(false)}>
                <Text style={styles.cancelText}>Simpan & Tutup</Text>
              </Pressable>
              <Pressable style={styles.nextBtn} onPress={() => saveCapaianModal(true)}>
                <Text style={styles.nextText}>Simpan & Berikutnya</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 14, paddingBottom: 36 },
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginRight: 8,
  },
  pillActive: { backgroundColor: '#065f46', borderColor: '#065f46' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  pillTextActive: { color: '#ffffff' },
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
  studentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  studentName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  studentNis: { fontSize: 11, color: '#64748b', marginTop: 2, marginBottom: 8 },
  scoreGrid: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  scoreCol: { flex: 1 },
  scoreLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 4 },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 7,
    fontSize: 15,
    fontWeight: '700',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    textAlign: 'center',
  },
  capaianChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  capaianChipFilled: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  capaianChipText: { fontSize: 11, fontWeight: '700', color: '#b45309' },
  capaianChipTextFilled: { color: '#065f46' },
  saveBtn: {
    backgroundColor: '#065f46',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  aiBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d97706',
    borderRadius: 10,
    paddingVertical: 12,
  },
  aiBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  modalSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  closeBtn: { padding: 4 },
  modalTextArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    marginBottom: 16,
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
  cancelText: { fontWeight: '700', color: '#334155', fontSize: 13 },
  nextBtn: {
    flex: 1,
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  nextText: { fontWeight: '700', color: '#ffffff', fontSize: 13 },
});
