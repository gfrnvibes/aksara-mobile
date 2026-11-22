import Ionicons from '@expo/vector-icons/Ionicons';
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
import { AnimatedCard } from '@/src/components/AnimatedCard';
import { TabHeader } from '@/src/components/TabHeader';
import { apiRequest, SiswaEkskulResponse, SiswaNilaiResponse } from '@/src/lib/api';

export default function SiswaAkademikScreen() {
  const [tab, setTab] = useState<'nilai' | 'ekskul'>('nilai');
  const [semester, setSemester] = useState<string>('');
  const [nilaiData, setNilaiData] = useState<SiswaNilaiResponse | null>(null);
  const [ekskulData, setEkskulData] = useState<SiswaEkskulResponse | null>(null);
  const [catatanOrtu, setCatatanOrtu] = useState('');
  const [savingCatatan, setSavingCatatan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (selectedSemester?: string) => {
    try {
      const query = selectedSemester ? `?semester=${encodeURIComponent(selectedSemester)}` : '';
      const [nilaiRes, ekskulRes] = await Promise.all([
        apiRequest<SiswaNilaiResponse>(`/siswa/nilai${query}`),
        apiRequest<SiswaEkskulResponse>('/siswa/ekstrakurikuler'),
      ]);
      setNilaiData(nilaiRes);
      setEkskulData(ekskulRes);
      setCatatanOrtu(nilaiRes.catatan_orang_tua ?? '');
      if (!selectedSemester && nilaiRes.semester_aktif) {
        setSemester(String(nilaiRes.semester_aktif));
      }
    } catch (e) {
      Alert.alert('Gagal Memuat', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleChangeSemester(sem: string) {
    setSemester(sem);
    setLoading(true);
    loadData(sem);
  }

  async function handleSaveCatatanOrtu() {
    setSavingCatatan(true);
    try {
      const semNum = Number(semester || nilaiData?.semester_aktif || 1);
      const res = await apiRequest<{ message: string; catatan_orang_tua: string | null }>(
        '/siswa/nilai/catatan-orang-tua',
        {
          method: 'POST',
          body: {
            semester: semNum,
            catatan_orang_tua: catatanOrtu.trim(),
          },
        },
      );
      setCatatanOrtu(res.catatan_orang_tua ?? '');
      Alert.alert('Tersimpan', res.message);
    } catch (e) {
      Alert.alert('Gagal Menyimpan', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setSavingCatatan(false);
    }
  }

  return (
    <View style={styles.container}>
      <TabHeader
        title="Akademik & Ekskul"
        subtitle="Nilai rapor, peringkat kelas, dan ekstrakurikuler yang diikuti"
      />

      <View style={styles.segmentWrap}>
        <Pressable
          style={[styles.segmentBtn, tab === 'nilai' && styles.segmentBtnActive]}
          onPress={() => setTab('nilai')}
        >
          <Ionicons
            name="ribbon-outline"
            size={16}
            color={tab === 'nilai' ? '#ffffff' : '#065f46'}
          />
          <Text style={[styles.segmentText, tab === 'nilai' && styles.segmentTextActive]}>
            Nilai & Peringkat
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, tab === 'ekskul' && styles.segmentBtnActive]}
          onPress={() => setTab('ekskul')}
        >
          <Ionicons
            name="football-outline"
            size={16}
            color={tab === 'ekskul' ? '#ffffff' : '#065f46'}
          />
          <Text style={[styles.segmentText, tab === 'ekskul' && styles.segmentTextActive]}>
            Ekstrakurikuler
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData(semester || undefined);
            }}
            tintColor="#065f46"
          />
        }
      >
        {loading && !nilaiData ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#065f46" />
          </View>
        ) : tab === 'nilai' ? (
          <>
            {Object.keys(nilaiData?.semester_opsi ?? {}).length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.semRow}
              >
                {Object.entries(nilaiData?.semester_opsi ?? {}).map(([optKey, optLabel]) => {
                  const active = (semester || String(nilaiData?.semester_aktif ?? '')) === optKey;
                  return (
                    <Pressable
                      key={optKey}
                      style={[styles.semChip, active && styles.semChipActive]}
                      onPress={() => handleChangeSemester(optKey)}
                    >
                      <Text style={[styles.semChipText, active && styles.semChipTextActive]}>
                        {optLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <AnimatedCard index={0} style={[styles.card, { marginBottom: 12 }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Peringkat Kelas</Text>
                  <Text style={styles.summaryValue}>
                    {nilaiData?.peringkat ? `#${nilaiData.peringkat}` : '-'}
                    {nilaiData?.jumlah_siswa_kelas ? (
                      <Text style={styles.summarySub}> / {nilaiData.jumlah_siswa_kelas}</Text>
                    ) : null}
                  </Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Rata-Rata</Text>
                  <Text style={[styles.summaryValue, { color: '#065f46' }]}>
                    {nilaiData?.rata_rata != null ? nilaiData.rata_rata.toFixed(1) : '-'}
                  </Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Jumlah Nilai</Text>
                  <Text style={styles.summaryValue}>
                    {nilaiData?.jumlah != null ? Math.round(nilaiData.jumlah) : '-'}
                  </Text>
                </View>
              </View>

              {nilaiData?.keputusan ? (
                <View style={styles.noteBox}>
                  <Text style={styles.keputusanText}>Keputusan: {nilaiData.keputusan}</Text>
                </View>
              ) : null}
            </AnimatedCard>

            <AnimatedCard index={1} style={[styles.card, { marginBottom: 12 }]}>
              <Text style={styles.catatanHeading}>Catatan Wali Kelas</Text>
              <Text style={styles.catatanBody}>
                {nilaiData?.catatan_wali_kelas?.trim()
                  ? nilaiData.catatan_wali_kelas
                  : 'Belum ada catatan wali kelas untuk semester ini.'}
              </Text>

              <View style={styles.catatanDivider} />

              <Text style={styles.catatanHeading}>Catatan Orang Tua / Wali</Text>
              <TextInput
                style={styles.catatanInput}
                value={catatanOrtu}
                onChangeText={setCatatanOrtu}
                placeholder="Tulis tanggapan atau catatan untuk wali kelas..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Pressable
                style={[styles.saveCatatanBtn, savingCatatan && { opacity: 0.7 }]}
                onPress={handleSaveCatatanOrtu}
                disabled={savingCatatan}
              >
                {savingCatatan ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={16} color="#ffffff" />
                    <Text style={styles.saveCatatanText}>Simpan Catatan</Text>
                  </>
                )}
              </Pressable>
            </AnimatedCard>

            {(nilaiData?.mapel?.length ?? 0) === 0 ? (
              <AnimatedCard index={1} style={styles.card}>
                <Text style={styles.emptyText}>
                  Belum ada data nilai untuk semester ini.
                </Text>
              </AnimatedCard>
            ) : (
              nilaiData?.mapel.map((item, idx) => {
                const belowKkm =
                  item.kkm != null &&
                  item.nilai_akhir != null &&
                  item.nilai_akhir < item.kkm;
                return (
                  <AnimatedCard key={item.id} index={idx + 1} style={[styles.card, { marginBottom: 10 }]}>
                    <View style={styles.mapelTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mapelName}>{item.mapel}</Text>
                        <Text style={styles.kkmText}>
                          KKM: {item.kkm ?? '-'} {item.sikap ? `• Sikap: ${item.sikap}` : ''}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.scoreBadge,
                          { backgroundColor: belowKkm ? '#fef2f2' : '#ecfdf5' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.scoreBadgeText,
                            { color: belowKkm ? '#b91c1c' : '#065f46' },
                          ]}
                        >
                          {item.nilai_akhir != null ? Math.round(item.nilai_akhir) : '-'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailItem}>
                        Pengetahuan: {item.nilai_pengetahuan ?? '-'}
                      </Text>
                      <Text style={styles.detailItem}>
                        Keterampilan: {item.nilai_keterampilan ?? '-'}
                      </Text>
                    </View>

                    {item.capaian_kompetensi ? (
                      <Text style={styles.capaianText}>{item.capaian_kompetensi}</Text>
                    ) : null}
                  </AnimatedCard>
                );
              })
            )}
          </>
        ) : (ekskulData?.ekskul?.length ?? 0) === 0 ? (
          <AnimatedCard index={0} style={styles.card}>
            <Text style={styles.emptyText}>
              Belum terdaftar pada kegiatan ekstrakurikuler.
            </Text>
          </AnimatedCard>
        ) : (
          ekskulData?.ekskul.map((item, idx) => (
            <AnimatedCard key={item.id} index={idx} style={[styles.card, { marginBottom: 10 }]}>
              <View style={styles.ekskulHeader}>
                <View style={styles.ekskulIcon}>
                  <Ionicons name="trophy-outline" size={20} color="#065f46" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapelName}>{item.nama}</Text>
                  <Text style={styles.kkmText}>
                    Pembina: {item.pembina ?? '-'}
                    {item.jabatan ? ` • ${item.jabatan}` : ''}
                  </Text>
                </View>
                {item.nilai ? (
                  <View style={[styles.scoreBadge, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.scoreBadgeText, { color: '#b45309' }]}>
                      {item.nilai}
                    </Text>
                  </View>
                ) : null}
              </View>
              {item.keterangan ? (
                <Text style={styles.capaianText}>{item.keterangan}</Text>
              ) : null}
            </AnimatedCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentBtnActive: { backgroundColor: '#065f46' },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#065f46' },
  segmentTextActive: { color: '#ffffff' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#064e3b',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  loaderBox: { padding: 40, alignItems: 'center' },
  semRow: { gap: 8, marginBottom: 12 },
  semChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  semChipActive: { backgroundColor: '#065f46', borderColor: '#065f46' },
  semChipText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  semChipTextActive: { color: '#ffffff' },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  summarySub: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  vDivider: { width: 1, height: 34, backgroundColor: '#e2e8f0' },
  noteBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 4,
  },
  keputusanText: { fontSize: 12, fontWeight: '700', color: '#065f46' },
  noteText: { fontSize: 12, color: '#475569', lineHeight: 18 },
  catatanHeading: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  catatanBody: { fontSize: 13, color: '#475569', lineHeight: 19 },
  catatanDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  catatanInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 74,
    marginTop: 4,
  },
  saveCatatanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
  },
  saveCatatanText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  mapelTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapelName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  kkmText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  scoreBadge: {
    minWidth: 46,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  scoreBadgeText: { fontSize: 16, fontWeight: '800' },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailItem: { fontSize: 12, color: '#475569', fontWeight: '600' },
  capaianText: { fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 17 },
  ekskulHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ekskulIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 13, paddingVertical: 12 },
});
