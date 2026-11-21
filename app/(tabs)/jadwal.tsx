import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnimatedCard } from '@/src/components/AnimatedCard';
import { apiRequest, JadwalHari, JadwalResponse } from '@/src/lib/api';

export default function JadwalScreen() {
  const router = useRouter();
  const [data, setData] = useState<JadwalResponse | null>(null);
  const [selectedHari, setSelectedHari] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJadwal = useCallback(async () => {
    try {
      setError(null);
      const res = await apiRequest<JadwalResponse>('/guru/jadwal');
      setData(res);
      setSelectedHari((prev) => {
        if (prev !== null) return prev;
        if (res.hari_ini) return res.hari_ini.hari;
        return res.hari[0]?.hari ?? 1;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat jadwal.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJadwal();
  }, [loadJadwal]);

  const activeDay: JadwalHari | undefined = data?.hari.find((h) => h.hari === selectedHari);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadJadwal();
          }}
        />
      }
    >
      <AnimatedCard index={0} onPress={() => router.push('/permintaan-jadwal')}>
        <LinearGradient colors={['#065f46', '#0f766e']} style={styles.prefBanner}>
          <View style={styles.prefLeft}>
            <Ionicons name="options-outline" size={22} color="#fde68a" />
            <View>
              <Text style={styles.prefTitle}>Permintaan & Preferensi Jadwal</Text>
              <Text style={styles.prefSub}>Atur jam tidak bisa / preferensi mengajar</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ffffff" />
        </LinearGradient>
      </AnimatedCard>

      {loading ? (
        <ActivityIndicator size="large" color="#065f46" style={styles.loader} />
      ) : error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !data?.jadwal_terbit ? (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={28} color="#d97706" />
          <Text style={styles.emptyTitle}>Jadwal Belum Terbit</Text>
          <Text style={styles.emptyText}>Jadwal mengajar semester ini belum diterbitkan oleh admin.</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs}>
            {data.hari.map((hari) => {
              const active = hari.hari === selectedHari;
              const isToday = data.hari_ini?.hari === hari.hari;
              return (
                <Pressable
                  key={hari.hari}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                  onPress={() => setSelectedHari(hari.hari)}
                >
                  <Text style={[styles.dayPillText, active && styles.dayPillTextActive]}>
                    {hari.label}{isToday ? ' •' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {activeDay && activeDay.pelajaran.length > 0 ? (
            activeDay.pelajaran.map((item, idx) => (
              <AnimatedCard key={item.id} index={idx + 1} style={styles.lessonCard}>
                <View style={styles.lessonTop}>
                  <Text style={styles.jpBadge}>JP {item.jp_ke}</Text>
                  <Text style={styles.timeText}>{item.waktu ?? 'Jam belum diatur'}</Text>
                </View>
                <Text style={styles.mapelTitle}>{item.mapel}</Text>
                <Text style={styles.kelasText}>Kelas {item.kelas}</Text>
              </AnimatedCard>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Tidak Ada Jam Mengajar</Text>
              <Text style={styles.emptyText}>Tidak ada jadwal pelajaran Anda pada hari {activeDay?.label ?? 'ini'}.</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 16, paddingBottom: 32 },
  prefBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  prefTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  prefSub: { color: '#d1fae5', fontSize: 12, marginTop: 2 },
  loader: { marginTop: 40 },
  dayTabs: { marginBottom: 14 },
  dayPill: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  dayPillActive: { backgroundColor: '#065f46', borderColor: '#065f46' },
  dayPillText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  dayPillTextActive: { color: '#ffffff' },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lessonTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  jpBadge: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  mapelTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  kelasText: { fontSize: 14, color: '#475569', marginTop: 3 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  errorText: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
});
