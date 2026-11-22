import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard } from '@/src/components/AnimatedCard';
import { IslamicPattern } from '@/src/components/IslamicPattern';
import { useAuth } from '@/src/context/AuthContext';
import {
  apiRequest,
  PengumumanItem,
  PengumumanResponse,
  SiswaBerandaResponse,
  SiswaNotifikasiItem,
  SiswaNotifikasiResponse,
} from '@/src/lib/api';

function formatRupiah(value: number): string {
  return 'Rp ' + Math.round(value || 0).toLocaleString('id-ID');
}

export default function SiswaBerandaScreen() {
  const { user, tahunAjaran, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<SiswaBerandaResponse | null>(null);
  const [pengumuman, setPengumuman] = useState<PengumumanItem[]>([]);
  const [notifikasi, setNotifikasi] = useState<SiswaNotifikasiItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<SiswaNotifikasiItem | null>(null);
  const [selectedPengumuman, setSelectedPengumuman] = useState<PengumumanItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [res, pengumumanRes, notifRes] = await Promise.all([
        apiRequest<SiswaBerandaResponse>('/siswa/beranda'),
        apiRequest<PengumumanResponse>('/pengumuman').catch(() => ({ pengumuman: [] })),
        apiRequest<SiswaNotifikasiResponse>('/siswa/notifikasi').catch(() => ({
          unread_count: 0,
          items: [],
        })),
      ]);
      setData(res);
      setPengumuman(pengumumanRes.pengumuman ?? []);
      setNotifikasi(notifRes.items ?? []);
      setUnreadCount(notifRes.unread_count ?? 0);
    } catch (e) {
      Alert.alert('Gagal Memuat', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  async function handleOpenNotifModal() {
    setSelectedNotif(null);
    setShowNotifModal(true);
    if (unreadCount > 0) {
      try {
        await apiRequest('/siswa/notifikasi/baca', { method: 'POST' });
        setUnreadCount(0);
        setNotifikasi((prev) =>
          prev.map((item) => ({
            ...item,
            dibaca_at: item.dibaca_at ?? new Date().toISOString(),
          })),
        );
      } catch {
        // Ignore mark-read error on modal open.
      }
    }
  }

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
            <Text style={styles.rolePillText} numberOfLines={1}>Portal Siswa</Text>
          </View>
          <View style={styles.heroActions}>
            <Pressable style={styles.notifBtn} onPress={handleOpenNotifModal}>
              <Ionicons name="notifications-outline" size={18} color="#ecfdf5" />
              {unreadCount > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.profilBtn} onPress={() => router.push('/profil')}>
              <Ionicons name="person-circle-outline" size={16} color="#ecfdf5" />
              <Text style={styles.profilBtnText}>Profil</Text>
            </Pressable>
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color="#fde68a" />
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
          {pengumuman.length > 0 && (
            <AnimatedCard index={0} style={[styles.pengumumanCard, styles.pengumumanPad, { marginBottom: 12 }]}>
              <View style={styles.pengumumanHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.pengumumanBadge}>
                    <Ionicons name="megaphone" size={12} color="#ffffff" />
                  </View>
                  <Text style={styles.pengumumanSectionTitle}>Pengumuman</Text>
                </View>
              </View>
              {pengumuman.map((item, idx) => (
                <View key={item.id}>
                  {idx > 0 && <View style={styles.pengumumanDivider} />}
                  <Pressable
                    style={styles.pengumumanItem}
                    onPress={() => setSelectedPengumuman(item)}
                  >
                    <View style={styles.pengumumanTitleRow}>
                      <Text style={styles.pengumumanTitle} numberOfLines={1}>
                        {item.judul}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#1d4ed8" />
                    </View>
                    <Text style={styles.pengumumanBody} numberOfLines={2}>
                      {item.isi}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </AnimatedCard>
          )}

          <AnimatedCard
            index={1}
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

          <AnimatedCard index={6} style={[styles.card, styles.cardPad]}>
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
              <Pressable style={styles.quickItem} onPress={() => router.push('/perpustakaan')}>
                <Ionicons name="library-outline" size={20} color="#065f46" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>Perpustakaan Digital</Text>
                  <Text style={styles.quickDesc}>Baca e-book pelajaran, PAI, dan literasi madrasah</Text>
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

      <Modal
        visible={selectedPengumuman !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPengumuman(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Pengumuman</Text>
              <Pressable onPress={() => setSelectedPengumuman(null)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            {selectedPengumuman && (
              <ScrollView style={{ maxHeight: 420 }}>
                <Text style={styles.detailTitle}>{selectedPengumuman.judul}</Text>
                <Text style={styles.detailMeta}>
                  {selectedPengumuman.created_at ?? '-'}
                  {selectedPengumuman.pembuat ? ` • ${selectedPengumuman.pembuat}` : ''}
                </Text>
                <Text style={styles.detailBody}>{selectedPengumuman.isi}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showNotifModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowNotifModal(false);
          setSelectedNotif(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              {selectedNotif ? (
                <Pressable
                  style={styles.modalBackBtn}
                  onPress={() => setSelectedNotif(null)}
                >
                  <Ionicons name="arrow-back" size={20} color="#065f46" />
                  <Text style={styles.modalTitle}>Detail Notifikasi</Text>
                </Pressable>
              ) : (
                <Text style={styles.modalTitle}>Notifikasi Aktivitas</Text>
              )}
              <Pressable
                onPress={() => {
                  setShowNotifModal(false);
                  setSelectedNotif(null);
                }}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>
            {selectedNotif ? (
              <ScrollView style={{ maxHeight: 420 }}>
                <Text style={styles.detailTitle}>{selectedNotif.judul}</Text>
                <Text style={styles.detailMeta}>{selectedNotif.created_at ?? '-'}</Text>
                <Text style={styles.detailBody}>{selectedNotif.isi}</Text>
              </ScrollView>
            ) : (
              <ScrollView style={{ maxHeight: 420 }}>
                {notifikasi.length === 0 ? (
                  <Text style={styles.emptyInfo}>Belum ada notifikasi aktivitas.</Text>
                ) : (
                  notifikasi.map((n, idx) => (
                    <View key={n.id}>
                      {idx > 0 && <View style={styles.divider} />}
                      <Pressable
                        style={styles.notifRow}
                        onPress={() => setSelectedNotif(n)}
                      >
                        <View style={styles.notifIconBox}>
                          <Ionicons name="notifications" size={16} color="#065f46" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.notifTitle} numberOfLines={1}>
                            {n.judul}
                          </Text>
                          <Text style={styles.notifBody} numberOfLines={2}>
                            {n.isi}
                          </Text>
                          <Text style={styles.notifTime}>{n.created_at ?? '-'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </Pressable>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBtn: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.16)',
    padding: 8,
    borderRadius: 999,
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
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
  emptyInfo: { fontSize: 13, color: '#1e3a8a', paddingVertical: 6 },
  pengumumanCard: {
    backgroundColor: 'rgba(219, 234, 254, 0.45)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2563eb',
  },
  pengumumanPad: { paddingHorizontal: 12, paddingVertical: 10 },
  pengumumanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pengumumanBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pengumumanSectionTitle: { fontSize: 13, fontWeight: '800', color: '#1e3a8a' },
  pengumumanDivider: { height: 1, backgroundColor: 'rgba(37, 99, 235, 0.2)' },
  pengumumanItem: { paddingVertical: 6 },
  pengumumanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pengumumanTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: '#0f172a' },
  pengumumanBody: { fontSize: 12, color: '#1e293b', marginTop: 2, lineHeight: 17 },
  modalBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  detailMeta: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginTop: 4, marginBottom: 10 },
  detailBody: { fontSize: 14, color: '#334155', lineHeight: 21 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  notifRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  notifIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  notifBody: { fontSize: 12, color: '#475569', marginTop: 2, lineHeight: 17 },
  notifTime: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
});
