import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

import { AnimatedCard } from '@/src/components/AnimatedCard';
import { IslamicPattern } from '@/src/components/IslamicPattern';
import { useAuth } from '@/src/context/AuthContext';
import { apiRequest, BerandaResponse } from '@/src/lib/api';

interface QuickMenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  route: string;
  visible?: boolean;
}

export default function BerandaScreen() {
  const router = useRouter();
  const { user, tahunAjaran } = useAuth();
  const [data, setData] = useState<BerandaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingHadir, setMarkingHadir] = useState(false);

  const loadBeranda = useCallback(async () => {
    try {
      const res = await apiRequest<BerandaResponse>('/guru/beranda');
      setData(res);
    } catch {
      // Handled by empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBeranda();
  }, [loadBeranda]);

  async function handleSayaHadir() {
    setMarkingHadir(true);
    try {
      const res = await apiRequest<{ message: string }>('/guru/kehadiran-gtk/hadir', {
        method: 'POST',
      });
      Alert.alert('Alhamdulillah', res.message);
      await loadBeranda();
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal mencatat kehadiran.');
    } finally {
      setMarkingHadir(false);
    }
  }

  const allQuickMenus: QuickMenuItem[] = [
    { label: 'Presensi', icon: 'checkbox-outline', colors: ['#059669', '#047857'], route: '/(tabs)/presensi' },
    { label: 'Jurnal', icon: 'book-outline', colors: ['#0d9488', '#0f766e'], route: '/(tabs)/jurnal' },
    { label: 'Input Nilai', icon: 'create-outline', colors: ['#d97706', '#b45309'], route: '/nilai' },
    { label: 'Perangkat', icon: 'document-text-outline', colors: ['#0284c7', '#0369a1'], route: '/perangkat' },
    {
      label: 'Leger Kelas',
      icon: 'stats-chart-outline',
      colors: ['#7c3aed', '#6d28d9'],
      route: '/leger',
      visible: data?.peran.is_wali_kelas ?? true,
    },
    {
      label: 'Rapor Kelas',
      icon: 'ribbon-outline',
      colors: ['#be185d', '#9d174d'],
      route: '/rapor',
      visible: data?.peran.is_wali_kelas ?? true,
    },
    { label: 'Piket & GTK', icon: 'shield-checkmark-outline', colors: ['#0f766e', '#115e59'], route: '/piket' },
    {
      label: 'Ekskul',
      icon: 'people-outline',
      colors: ['#ea580c', '#c2410c'],
      route: '/organisasi',
      visible: data?.peran.is_pembina_ekskul ?? true,
    },
  ];
  const quickMenus = allQuickMenus.filter((item) => item.visible !== false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBeranda} />}
    >
      <LinearGradient colors={['#064e3b', '#065f46', '#0f766e']} style={styles.hero}>
        <IslamicPattern opacity={0.18} />
        <View style={styles.heroTop}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.salam}>Assalamu&apos;alaikum,</Text>
            <Text style={styles.teacherName}>{user?.gtk?.nama ?? user?.name}</Text>
            <Text style={styles.heroMeta}>
              {data?.hari_ini ?? 'Hari ini'} · {tahunAjaran ? `${tahunAjaran.nama} (${tahunAjaran.semester})` : 'Aksara'}
            </Text>
          </View>
          <Pressable style={styles.profileBtn} onPress={() => router.push('/profil')}>
            <Ionicons name="person-circle-outline" size={32} color="#fde68a" />
          </Pressable>
        </View>

        <View style={styles.hadirCard}>
          <View style={styles.hadirLeft}>
            <Ionicons
              name={data?.kehadiran_gtk_hari_ini ? 'checkmark-circle' : 'time-outline'}
              size={22}
              color={data?.kehadiran_gtk_hari_ini ? '#34d399' : '#fde68a'}
            />
            <View>
              <Text style={styles.hadirTitle}>
                {data?.kehadiran_gtk_hari_ini
                  ? `Status Hari Ini: ${data.kehadiran_gtk_hari_ini.label}`
                  : 'Kehadiran GTK Hari Ini'}
              </Text>
              <Text style={styles.hadirSub}>
                {data?.kehadiran_gtk_hari_ini?.dicatat_pada
                  ? `Tercatat pukul ${data.kehadiran_gtk_hari_ini.dicatat_pada} WIB`
                  : 'Belum tercatat hari ini'}
              </Text>
            </View>
          </View>

          {!data?.kehadiran_gtk_hari_ini && (
            <Pressable
              style={styles.hadirBtn}
              onPress={() => router.push('/presensi-lokasi')}
            >
              <Text style={styles.hadirBtnText}>Saya Hadir</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {data && (
          <AnimatedCard index={0} style={styles.progressCard} onPress={() => router.push('/perangkat')}>
            <View style={styles.progressHeader}>
              <View style={styles.rowGap}>
                <Ionicons name="checkmark-done-circle" size={20} color="#065f46" />
                <Text style={styles.sectionTitle}>Tugas Administrasi Guru</Text>
              </View>
              <Text style={styles.percentBadge}>{data.tugas.persen}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${data.tugas.persen}%` }]} />
            </View>
            <Text style={styles.progressSub}>
              {data.tugas.selesai} dari {data.tugas.total} tugas selesai · Ketuk untuk detail
            </Text>
          </AnimatedCard>
        )}

        <Text style={styles.blockLabel}>Layanan Panel Guru</Text>
        <View style={styles.grid}>
          {quickMenus.map((item, idx) => (
            <AnimatedCard
              key={item.label}
              index={idx + 1}
              style={styles.gridItem}
              contentStyle={styles.gridItemContent}
              onPress={() => router.push(item.route as never)}
            >
              <LinearGradient colors={item.colors} style={styles.gridIconBox}>
                <Ionicons name={item.icon} size={22} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.gridLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </AnimatedCard>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.blockLabel}>Jadwal Mengajar Hari Ini</Text>
          <Pressable onPress={() => router.push('/(tabs)/jadwal')}>
            <Text style={styles.linkText}>Lihat Semua</Text>
          </Pressable>
        </View>

        {loading && !data ? (
          <ActivityIndicator color="#065f46" style={{ marginVertical: 20 }} />
        ) : data && data.jadwal_hari_ini.length > 0 ? (
          data.jadwal_hari_ini.map((item, idx) => (
            <AnimatedCard key={item.id} index={idx + 3} style={styles.lessonCard}>
              <View style={styles.jpPill}>
                <Text style={styles.jpText}>JP {item.jp_ke}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lessonTitle}>{item.mapel}</Text>
                <Text style={styles.lessonSub}>
                  Kelas {item.kelas} · {item.waktu ?? 'Jam belum diatur'}
                </Text>
              </View>
            </AnimatedCard>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="sunny-outline" size={24} color="#d97706" />
            <Text style={styles.emptyText}>Tidak ada jadwal mengajar pada hari ini.</Text>
          </View>
        )}

        <Text style={[styles.blockLabel, { marginTop: 18 }]}>Agenda Madrasah (30 Hari)</Text>
        {data && data.agenda.length > 0 ? (
          data.agenda.map((ag, idx) => (
            <AnimatedCard key={ag.id} index={idx + 5} style={styles.agendaCard}>
              <View style={styles.agendaDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.agendaTitle}>{ag.nama}</Text>
                <Text style={styles.agendaMeta}>
                  {ag.rentang} · {ag.jenis}
                </Text>
              </View>
            </AnimatedCard>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada agenda madrasah dalam 30 hari ke depan.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { paddingBottom: 32 },
  hero: {
    paddingTop: 52,
    paddingBottom: 22,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTextWrap: { flex: 1, paddingRight: 10 },
  salam: { color: '#fde68a', fontSize: 13, fontWeight: '600' },
  teacherName: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  heroMeta: { color: '#d1fae5', fontSize: 12, marginTop: 4 },
  profileBtn: { padding: 4 },
  hadirCard: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  hadirLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  hadirTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  hadirSub: { color: '#d1fae5', fontSize: 11, marginTop: 2 },
  hadirBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hadirBtnText: { color: '#064e3b', fontWeight: '800', fontSize: 12 },
  body: { padding: 16 },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  percentBadge: { fontSize: 14, fontWeight: '800', color: '#065f46' },
  progressTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 999 },
  progressSub: { fontSize: 12, color: '#64748b', marginTop: 8 },
  blockLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 18,
  },
  gridItem: {
    width: '23.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gridItemContent: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  gridIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridLabel: { fontSize: 11, fontWeight: '600', color: '#1e293b', textAlign: 'center' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { fontSize: 13, fontWeight: '700', color: '#0f766e', marginBottom: 10 },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  jpPill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  jpText: { color: '#065f46', fontWeight: '800', fontSize: 12 },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  lessonSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  agendaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  agendaDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#d97706' },
  agendaTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  agendaMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
