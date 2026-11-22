import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AnimatedCard } from '@/src/components/AnimatedCard';
import { TabHeader } from '@/src/components/TabHeader';
import { apiRequest, SiswaPresensiResponse } from '@/src/lib/api';

function statusStyle(status: string): { bg: string; fg: string } {
  const s = status.toLowerCase();
  if (s === 'h' || s === 'hadir') return { bg: '#ecfdf5', fg: '#065f46' };
  if (s === 's' || s === 'sakit') return { bg: '#fef3c7', fg: '#b45309' };
  if (s === 'i' || s === 'izin') return { bg: '#eff6ff', fg: '#1d4ed8' };
  return { bg: '#fef2f2', fg: '#b91c1c' };
}

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatTanggalIndonesia(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return value;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const hari = NAMA_HARI[date.getDay()] ?? '';
  return `${hari}, ${match[3]}-${match[2]}-${match[1]}`;
}

export default function SiswaPresensiScreen() {
  const [data, setData] = useState<SiswaPresensiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await apiRequest<SiswaPresensiResponse>('/siswa/presensi');
      setData(res);
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

  const rekap = data?.rekap;

  return (
    <View style={styles.container}>
      <TabHeader
        title="Presensi Siswa"
        subtitle={data?.semester ? `Rekap kehadirannya — Semester ${data.semester}` : 'Rekap & riwayat kehadiran harian'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor="#065f46"
          />
        }
      >
        {loading && !data ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#065f46" />
          </View>
        ) : (
          <>
            <AnimatedCard index={0} style={[styles.card, { marginBottom: 14 }]}>
              <Text style={styles.cardHeading}>Rekap Kehadiran</Text>
              <View style={styles.rekapRow}>
                <View style={[styles.rekapBox, { backgroundColor: '#ecfdf5' }]}>
                  <Text style={[styles.rekapNum, { color: '#065f46' }]}>{rekap?.hadir ?? 0}</Text>
                  <Text style={styles.rekapLabel}>Hadir</Text>
                </View>
                <View style={[styles.rekapBox, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.rekapNum, { color: '#b45309' }]}>{rekap?.sakit ?? 0}</Text>
                  <Text style={styles.rekapLabel}>Sakit</Text>
                </View>
                <View style={[styles.rekapBox, { backgroundColor: '#eff6ff' }]}>
                  <Text style={[styles.rekapNum, { color: '#1d4ed8' }]}>{rekap?.izin ?? 0}</Text>
                  <Text style={styles.rekapLabel}>Izin</Text>
                </View>
                <View style={[styles.rekapBox, { backgroundColor: '#fef2f2' }]}>
                  <Text style={[styles.rekapNum, { color: '#b91c1c' }]}>{rekap?.alpa ?? 0}</Text>
                  <Text style={styles.rekapLabel}>Alfa</Text>
                </View>
              </View>
            </AnimatedCard>

            <Text style={styles.sectionLabel}>Riwayat Harian</Text>

            {(data?.riwayat?.length ?? 0) === 0 ? (
              <AnimatedCard index={1} style={styles.card}>
                <Text style={styles.emptyText}>Belum ada riwayat presensi tercatat.</Text>
              </AnimatedCard>
            ) : (
              data?.riwayat.map((item, idx) => {
                const badge = statusStyle(item.status);
                return (
                  <AnimatedCard key={item.id} index={idx + 1} style={[styles.card, { marginBottom: 10 }]}>
                    <View style={styles.row}>
                      <View style={styles.dateIcon}>
                        <Ionicons name="calendar-outline" size={18} color="#065f46" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dateText}>{formatTanggalIndonesia(item.tanggal)}</Text>
                        {item.terlambat_menit ? (
                          <Text style={styles.subText}>
                            Terlambat {item.terlambat_menit} menit
                          </Text>
                        ) : null}
                        {item.catatan ? (
                          <Text style={styles.subText}>{item.catatan}</Text>
                        ) : null}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusText, { color: badge.fg }]}>
                          {item.status_label}
                        </Text>
                      </View>
                    </View>
                  </AnimatedCard>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
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
  cardHeading: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  rekapRow: { flexDirection: 'row', gap: 8 },
  rekapBox: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  rekapNum: { fontSize: 20, fontWeight: '800' },
  rekapLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 2 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    marginLeft: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  subText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 13, paddingVertical: 12 },
});
