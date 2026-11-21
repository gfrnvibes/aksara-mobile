import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedCard } from '@/src/components/AnimatedCard';
import { apiRequest, PerangkatResponse } from '@/src/lib/api';

export default function PerangkatScreen() {
  const [data, setData] = useState<PerangkatResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<PerangkatResponse>('/guru/perangkat')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#065f46" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoBanner}>
        <Ionicons name="laptop-outline" size={22} color="#b45309" />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Kelola Dokumen di Website / Laptop</Text>
          <Text style={styles.infoBody}>
            Pembuatan, pengeditan, dan ekspor Perangkat Ajar, ATP, Prota, dan Prosem dilakukan melalui website Aksara (disarankan di laptop/komputer). Aplikasi mobile menampilkan ringkasan progres dan checklist tugas Anda.
          </Text>
        </View>
      </View>

      {data && (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{data.dokumen.atp}</Text>
              <Text style={styles.statLbl}>ATP</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{data.dokumen.prota}</Text>
              <Text style={styles.statLbl}>Prota</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{data.dokumen.prosem}</Text>
              <Text style={styles.statLbl}>Prosem</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{data.dokumen.perangkat_ajar}</Text>
              <Text style={styles.statLbl}>Modul</Text>
            </View>
          </View>

          <Text style={styles.heading}>Checklist Tugas Administrasi ({data.ringkasan.persen}%)</Text>
          {data.ringkasan.items.map((item, idx) => (
            <AnimatedCard key={item.id} index={idx} style={styles.card}>
              <View style={styles.row}>
                <Ionicons
                  name={item.status === 'selesai' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={item.status === 'selesai' ? '#059669' : '#d97706'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.judul}</Text>
                  <Text style={styles.sub}>{item.ringkasan}</Text>
                </View>
                <Text style={styles.badge}>{item.labelStatus}</Text>
              </View>
            </AnimatedCard>
          ))}

          <Text style={[styles.heading, { marginTop: 14 }]}>Penugasan Mengajar</Text>
          {data.penugasan.map((p, idx) => (
            <AnimatedCard key={p.id} index={idx + 4} style={styles.card}>
              <Text style={styles.title}>{p.mapel}</Text>
              <Text style={styles.sub}>Kelas {p.kelas}</Text>
            </AnimatedCard>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f8f6' },
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 16, paddingBottom: 32 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 3 },
  infoBody: { fontSize: 12, color: '#78350f', lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: { fontSize: 20, fontWeight: '800', color: '#065f46' },
  statLbl: { fontSize: 12, color: '#64748b', marginTop: 2 },
  heading: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { fontSize: 11, fontWeight: '700', color: '#065f46' },
});
