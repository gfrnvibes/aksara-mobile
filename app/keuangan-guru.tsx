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
import { apiRequest, GuruKeuanganResponse } from '@/src/lib/api';

function formatRupiah(value: number): string {
  return 'Rp ' + Math.round(value || 0).toLocaleString('id-ID');
}

export default function KeuanganGuruScreen() {
  const [data, setData] = useState<GuruKeuanganResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await apiRequest<GuruKeuanganResponse>('/guru/keuangan');
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

  const ringkasan = data?.ringkasan;

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
      {loading && !data ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#065f46" />
          <Text style={styles.loaderText}>Memuat data gaji guru...</Text>
        </View>
      ) : (
        <>
          <AnimatedCard index={0} style={styles.summaryCard}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Diterima</Text>
                <Text style={[styles.summaryValue, { color: '#065f46' }]}>
                  {formatRupiah(ringkasan?.total_diterima ?? 0)}
                </Text>
              </View>
              <View style={styles.vDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Belum Dibayar</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: (ringkasan?.total_belum_dibayar ?? 0) > 0 ? '#b45309' : '#0f172a' },
                  ]}
                >
                  {formatRupiah(ringkasan?.total_belum_dibayar ?? 0)}
                </Text>
              </View>
            </View>
            <View style={styles.slipCountRow}>
              <Ionicons name="document-text-outline" size={15} color="#64748b" />
              <Text style={styles.slipCountText}>
                Total {ringkasan?.jumlah_slip ?? 0} slip gaji tercatat
              </Text>
            </View>
          </AnimatedCard>

          <Text style={styles.sectionHeading}>Rincian Slip Gaji & Tunjangan</Text>

          {(data?.slip?.length ?? 0) === 0 ? (
            <AnimatedCard index={1} style={styles.card}>
              <Text style={styles.emptyText}>Belum ada data slip gaji untuk akun ini.</Text>
            </AnimatedCard>
          ) : (
            data?.slip.map((item, idx) => (
              <AnimatedCard key={item.id} index={idx + 1} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.periodeTitle}>Periode {item.periode}</Text>
                    <Text style={styles.dateText}>
                      {item.sudah_dibayar
                        ? `Dibayar: ${item.tanggal_bayar ?? '-'}`
                        : 'Menunggu pencairan'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: item.sudah_dibayar ? '#ecfdf5' : '#fef3c7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: item.sudah_dibayar ? '#065f46' : '#b45309' },
                      ]}
                    >
                      {item.sudah_dibayar ? 'Sudah Dibayar' : 'Belum Dibayar'}
                    </Text>
                  </View>
                </View>

                <View style={styles.breakdownBox}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Gaji Pokok</Text>
                    <Text style={styles.breakdownVal}>{formatRupiah(item.gaji_pokok)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Tunjangan</Text>
                    <Text style={[styles.breakdownVal, { color: '#065f46' }]}>
                      +{formatRupiah(item.tunjangan)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Potongan</Text>
                    <Text style={[styles.breakdownVal, { color: '#b91c1c' }]}>
                      -{formatRupiah(item.potongan)}
                    </Text>
                  </View>
                  <View style={styles.totalDivider} />
                  <View style={styles.breakdownRow}>
                    <Text style={styles.totalLabel}>Gaji Bersih</Text>
                    <Text style={styles.totalVal}>{formatRupiah(item.bersih)}</Text>
                  </View>
                </View>

                {item.catatan ? <Text style={styles.catatanText}>{item.catatan}</Text> : null}
              </AnimatedCard>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 16, paddingBottom: 32 },
  loaderBox: { padding: 48, alignItems: 'center', gap: 10 },
  loaderText: { color: '#64748b', fontSize: 13 },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  summaryGrid: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  summaryValue: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  vDivider: { width: 1, height: 36, backgroundColor: '#e2e8f0' },
  slipCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  slipCountText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  sectionHeading: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 10 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  periodeTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  dateText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  breakdownBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 13, color: '#475569' },
  breakdownVal: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  totalDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
  totalLabel: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  totalVal: { fontSize: 15, fontWeight: '800', color: '#065f46' },
  catatanText: { fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 13, paddingVertical: 12 },
});
