import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedCard } from '@/src/components/AnimatedCard';
import { SwipeTabScreen } from '@/src/components/SwipeTabScreen';
import { TabHeader } from '@/src/components/TabHeader';

interface MenuItem {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  route: string;
}

const MENU_GROUPS: { heading: string; items: MenuItem[] }[] = [
  {
    heading: 'Penilaian & Wali Kelas',
    items: [
      {
        title: 'Input Nilai',
        subtitle: 'Isi nilai pengetahuan, keterampilan, atau nilai akhir & capaian',
        icon: 'create-outline',
        colors: ['#d97706', '#b45309'],
        route: '/nilai',
      },
      {
        title: 'Leger Kelas Saya',
        subtitle: 'Rekap nilai, rata-rata, dan peringkat siswa kelas perwalian',
        icon: 'stats-chart-outline',
        colors: ['#7c3aed', '#6d28d9'],
        route: '/leger',
      },
      {
        title: 'Rapor Kelas Saya',
        subtitle: 'Catatan wali kelas, rekap S/I/A, dan keputusan kenaikan',
        icon: 'ribbon-outline',
        colors: ['#be185d', '#9d174d'],
        route: '/rapor',
      },
    ],
  },
  {
    heading: 'Administrasi & Pembinaan',
    items: [
      {
        title: 'Perangkat & Tugas Guru',
        subtitle: 'Progres ATP, Prota, Prosem, Perangkat Ajar, & checklist tugas',
        icon: 'document-text-outline',
        colors: ['#0284c7', '#0369a1'],
        route: '/perangkat',
      },
      {
        title: 'Kehadiran GTK & Buku Piket',
        subtitle: 'Catat kehadiran diri/GTK dan kejadian piket harian',
        icon: 'shield-checkmark-outline',
        colors: ['#059669', '#047857'],
        route: '/piket',
      },
      {
        title: 'Organisasi & Ekskul',
        subtitle: 'Kelola kegiatan ekstrakurikuler binaan Anda',
        icon: 'people-outline',
        colors: ['#ea580c', '#c2410c'],
        route: '/organisasi',
      },
      {
        title: 'Permintaan Jadwal',
        subtitle: 'Atur preferensi jam mengajar & hari tidak bisa',
        icon: 'options-outline',
        colors: ['#0f766e', '#115e59'],
        route: '/permintaan-jadwal',
      },
    ],
  },
  {
    heading: 'Akun',
    items: [
      {
        title: 'Profil & Pengaturan Server',
        subtitle: 'Informasi GTK, tahun ajaran aktif, URL API, dan keluar',
        icon: 'person-circle-outline',
        colors: ['#334155', '#1e293b'],
        route: '/profil',
      },
    ],
  },
];

export default function LainnyaScreen() {
  const router = useRouter();

  return (
    <SwipeTabScreen current="lainnya">
      <TabHeader title="Menu Panel Guru" subtitle="Penilaian, wali kelas, perangkat, & akun" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {MENU_GROUPS.map((group) => (
        <View key={group.heading} style={styles.group}>
          <Text style={styles.heading}>{group.heading}</Text>
          {group.items.map((item, idx) => (
            <AnimatedCard
              key={item.route}
              index={idx}
              style={styles.card}
              contentStyle={styles.cardContent}
              onPress={() => router.push(item.route as never)}
            >
              <LinearGradient colors={item.colors} style={styles.iconBox}>
                <Ionicons name={item.icon} size={22} color="#ffffff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </AnimatedCard>
          ))}
        </View>
      ))}
    </ScrollView>
    </SwipeTabScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 16, paddingBottom: 32 },
  group: { marginBottom: 18 },
  heading: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
