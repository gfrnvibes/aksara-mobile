import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard } from '@/src/components/AnimatedCard';
import { IslamicPattern } from '@/src/components/IslamicPattern';
import { useAuth } from '@/src/context/AuthContext';
import { apiRequest, SiswaBerandaResponse } from '@/src/lib/api';

function formatRupiah(value: number): string {
  return 'Rp ' + Math.round(value || 0).toLocaleString('id-ID');
}

export default function SiswaBerandaScreen() {
  const { user, tahunAjaran, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<SiswaBerandaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await apiRequest<SiswaBerandaResponse>('/siswa/beranda');
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

  function handleLogout() {
    Alert.alert('Keluar Akun', 'Apakah Anda yakin ingin keluar dari Portal Siswa / Orang Tua?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  }

  const siswa = data?.siswa;
  const ringkasan = data?.ringkasan;
  const presensi = ringkasan?.presensi_bulan_ini;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
      <LinearGradient
        colors={['#064e3b', '#065f46', '#0f766e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: Math.max(insets.top + 14, 48) }]}
      >
        <IslamicPattern opacity={0.1} />

        <View style={styles.heroTopRow}>
          <View style={styles.rolePill}>
            <Ionicons name="people" size={13} color="#fbbf24" />
            <Text style={styles.rolePillText}>Portal Siswa & Orang Tua</Text>
          </View>
          <View style={styles.heroActions}>
            <Pressable style={styles.profilBtn} onPress={() => router.push('/profil')}>
              <Ionicons name="person-circle-outline" size={17} color="#ecfdf5" />
              <Text style={styles.profilBtnText}>Profil</Text>
            </Pressable>
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={17} color="#fde68a" />
              <Text style={styles.logoutText}>Keluar</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.greeting}>Assalamu&apos;alaikum,</Text>
        <Text style={styles.studentName}>{siswa?.nama ?? user?.siswa?.nama ?? user?.name ?? 'Siswa'}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="card-outline" size={13} color="#a7f3d0" />
            <Text style={styles.metaText}>
              NIS {siswa?.nis ?? user?.siswa?.nis ?? '-'}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="business-outline" size={13} color="#a7f3d0" />
            <Text style={styles.metaText}>
              {siswa?.kelas ?? user?.siswa?.kelas ?? 'Belum ada kelas'}
            </Text>
          </View>
        </View>

        <Text style={styles.taText}>
          Tahun Ajaran {data?.tahun_ajaran ?? tahunAjaran?.nama ?? '-'}
          {data?.semester
            ? ` • ${data.semester.toLowerCase().startsWith('semester') ? data.semester : `Semester ${data.semester}`}`
            : ''}
          {siswa?.wali_kelas ? ` • Wali Kelas: ${siswa.wali_kelas}` : ''}
        </Text>
      </LinearGradient>

      {loading && !data ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#065f46" />
          <Text style={styles.loaderText}>Memuat ringkasan siswa...</Text>
        </View>
      ) : (
        <View style={styles.body}>
          <AnimatedCard
            index={0}
            style={[styles.card, { marginBottom: 12 }]}
            contentStyle={styles.cardPad}
            onPress={() => router.push('/(siswa)/presensi')}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="calendar-outline" size={18} color="#065f46" />
                <Text style={styles.sectionTitle}>Presensi Bulan Ini</Text>
              </View>
              <Text style={styles.linkText}>Detail →</Text>
            </View>
            <View style={styles.presensiRow}>
              <View style={[styles.presensiPill, { backgroundColor: '#ecfdf5' }]}>
                <Text style={[styles.presensiCount, { color: '#065f46' }]}>
                  {presensi?.hadir ?? 0}
                </Text>
                <Text style={styles.presensiLabel}>Hadir</Text>
              </View>
              <View style={[styles.presensiPill, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.presensiCount, { color: '#b45309' }]}>
                  {presensi?.sakit ?? 0}
                </Text>
                <Text style={styles.presensiLabel}>Sakit</Text>
              </View>
              <View style={[styles.presensiPill, { backgroundColor: '#eff6ff' }]}>
                <Text style={[styles.presensiCount, { color: '#1d4ed8' }]}>
                  {presensi?.izin ?? 0}
                </Text>
                <Text style={styles.presensiLabel}>Izin</Text>
              </View>
              <View style={[styles.presensiPill, { backgroundColor: '#fef2f2' }]}>
                <Text style={[styles.presensiCount, { color: '#b91c1c' }]}>
                  {presensi?.alpa ?? 0}
                </Text>
                <Text style={styles.presensiLabel}>Alfa</Text>
              </View>
            </View>
          </AnimatedCard>

          <View style={styles.grid}>
            <AnimatedCard
              index={1}
              style={[styles.card, styles.gridItem]}
              contentStyle={styles.metricCard}
              onPress={() => router.push('/(siswa)/keuangan')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="wallet-outline" size={20} color="#065f46" />
              </View>
              <Text style={styles.metricLabel}>Saldo Tabungan</Text>
              <Text style={[styles.metricValue, { color: '#065f46' }]}>
                {formatRupiah(ringkasan?.saldo_tabungan ?? 0)}
              </Text>
            </AnimatedCard>

            <AnimatedCard
              index={2}
              style={[styles.card, styles.gridItem]}
              contentStyle={styles.metricCard}
              onPress={() => router.push('/(siswa)/keuangan')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="receipt-outline" size={20} color="#b45309" />
              </View>
              <Text style={styles.metricLabel}>Sisa Tagihan</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: (ringkasan?.total_tagihan_sisa ?? 0) > 0 ? '#b45309' : '#065f46' },
                ]}
              >
                {formatRupiah(ringkasan?.total_tagihan_sisa ?? 0)}
              </Text>
            </AnimatedCard>

            <AnimatedCard
              index={3}
              style={[styles.card, styles.gridItem]}
              contentStyle={styles.metricCard}
              onPress={() => router.push('/(siswa)/akademik')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="ribbon-outline" size={20} color="#1d4ed8" />
              </View>
              <Text style={styles.metricLabel}>Peringkat Kelas</Text>
              <Text style={[styles.metricValue, { color: '#1e3a8a' }]}>
                {ringkasan?.peringkat ? `#${ringkasan.peringkat}` : '-'}
              </Text>
              <Text style={styles.metricSub}>
                Rata-rata: {ringkasan?.rata_rata != null ? ringkasan.rata_rata.toFixed(1) : '-'}
              </Text>
            </AnimatedCard>

            <AnimatedCard
              index={4}
              style={[styles.card, styles.gridItem]}
              contentStyle={styles.metricCard}
              onPress={() => router.push('/(siswa)/catatan')}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="medal-outline" size={20} color="#b91c1c" />
              </View>
              <Text style={styles.metricLabel}>Catatan Sikap</Text>
              <Text style={[styles.metricValue, { color: '#0f172a' }]}>
                {ringkasan?.jumlah_prestasi ?? 0} Prestasi
              </Text>
              <Text style={styles.metricSub}>
                Poin Pelanggaran: {ringkasan?.poin_pelanggaran ?? 0}
              </Text>
            </AnimatedCard>
          </View>

          <AnimatedCard index={5} style={[styles.card, styles.cardPad]}>
            <Text style={styles.sectionTitle}>Menu Cepat Siswa & Wali</Text>
            <View style={styles.quickList}>
              <Pressable style={styles.quickItem} onPress={() => router.push('/profil')}>
                <Ionicons name="id-card-outline" size={20} color="#065f46" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>Identitas Siswa & Pengaturan Akun</Text>
                  <Text style={styles.quickDesc}>Lihat biodata siswa, ganti password, & kunci biometrik</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>
              <View style={styles.divider} />
              <Pressable style={styles.quickItem} onPress={() => router.push('/(siswa)/akademik')}>
                <Ionicons name="book-outline" size={20} color="#065f46" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>Nilai Rapor & Ekstrakurikuler</Text>
                  <Text style={styles.quickDesc}>Pantau nilai mapel, peringkat, dan kegiatan ekskul</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>
              <View style={styles.divider} />
              <Pressable style={styles.quickItem} onPress={() => router.push('/(siswa)/catatan')}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#d97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>Catatan Prestasi & Pelanggaran</Text>
                  <Text style={styles.quickDesc}>Riwayat penghargaan dan poin kedisiplinan siswa</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>
              <View style={styles.divider} />
              <Pressable style={styles.quickItem} onPress={() => router.push('/(siswa)/keuangan')}>
                <Ionicons name="cash-outline" size={20} color="#0f766e" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>Tagihan & Buku Tabungan</Text>
                  <Text style={styles.quickDesc}>Cek tagihan sekolah dan mutasi tabungan siswa</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>
            </View>
          </AnimatedCard>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { paddingBottom: 32 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  rolePillText: { color: '#fef3c7', fontSize: 11, fontWeight: '700' },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  profilBtnText: { color: '#ecfdf5', fontSize: 12, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  logoutText: { color: '#fde68a', fontSize: 12, fontWeight: '600' },
  greeting: { color: '#d1fae5', fontSize: 13, fontWeight: '500' },
  studentName: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: { color: '#ecfdf5', fontSize: 12, fontWeight: '600' },
  taText: { color: '#a7f3d0', fontSize: 12, marginTop: 10 },
  loaderBox: { padding: 48, alignItems: 'center', gap: 10 },
  loaderText: { color: '#64748b', fontSize: 13 },
  body: { padding: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#064e3b',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPad: { padding: 14 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  gridItem: { width: '48.5%' },
  metricCard: { padding: 14 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  metricValue: { fontSize: 16, fontWeight: '800', marginTop: 3 },
  metricSub: { fontSize: 11, color: '#64748b', marginTop: 3 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  linkText: { fontSize: 12, fontWeight: '700', color: '#0f766e' },
  presensiRow: { flexDirection: 'row', gap: 8 },
  presensiPill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  presensiCount: { fontSize: 18, fontWeight: '800' },
  presensiLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 2 },
  quickList: { marginTop: 10 },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  quickTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  quickDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
});
