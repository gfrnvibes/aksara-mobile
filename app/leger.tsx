import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedCard } from '@/src/components/AnimatedCard';
import { apiRequest, LegerResponse, NilaiOpsiResponse } from '@/src/lib/api';

export default function LegerScreen() {
  const [opsi, setOpsi] = useState<NilaiOpsiResponse | null>(null);
  const [kelasId, setKelasId] = useState<number | null>(null);
  const [semester, setSemester] = useState<number>(1);
  const [leger, setLeger] = useState<LegerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<NilaiOpsiResponse>('/guru/nilai/opsi')
      .then((res) => {
        setOpsi(res);
        setSemester(res.semester_aktif);
        setKelasId(res.kelas_perwalian[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadLeger = useCallback(async () => {
    if (!opsi?.tahun_ajaran_aktif_id || !kelasId) return;
    setLoading(true);
    try {
      const res = await apiRequest<LegerResponse>(
        `/guru/leger?kelas_id=${kelasId}&tahun_ajaran_id=${opsi.tahun_ajaran_aktif_id}&semester=${semester}`,
      );
      setLeger(res);
    } finally {
      setLoading(false);
    }
  }, [opsi, kelasId, semester]);

  useEffect(() => {
    loadLeger();
  }, [loadLeger]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {opsi && opsi.kelas_perwalian.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="information-circle-outline" size={28} color="#d97706" />
          <Text style={styles.emptyText}>Menu Leger hanya tersedia untuk Wali Kelas.</Text>
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
          ) : leger ? (
            <>
              <Text style={styles.heading}>{leger.judul}</Text>
              <Text style={styles.sub}>{leger.keterangan_kolom}</Text>
              {leger.baris.map((row, idx) => (
                <AnimatedCard key={row.siswa_id} index={idx} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{row.nama}</Text>
                      <Text style={styles.meta}>
                        Jumlah: {row.jumlah} · Rata-rata: {row.rata_rata?.toFixed(2) ?? '—'}
                      </Text>
                    </View>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{row.peringkat ?? '—'}</Text>
                    </View>
                  </View>
                </AnimatedCard>
              ))}
            </>
          ) : null}
        </>
      )}
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
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  pillActive: { backgroundColor: '#065f46', borderColor: '#065f46' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  pillTextActive: { color: '#ffffff' },
  heading: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 13, color: '#475569', marginTop: 3 },
  rankBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rankText: { color: '#b45309', fontWeight: '800', fontSize: 14 },
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
});
