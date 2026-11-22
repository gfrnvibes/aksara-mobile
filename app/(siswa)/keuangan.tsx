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
  View,
} from 'react-native';
import { AnimatedCard } from '@/src/components/AnimatedCard';
import { TabHeader } from '@/src/components/TabHeader';
import { apiRequest, SiswaKeuanganResponse } from '@/src/lib/api';

function formatRupiah(value: number): string {
  return 'Rp ' + Math.round(value || 0).toLocaleString('id-ID');
}

function tagihanStatusStyle(status: string): { bg: string; fg: string; label: string } {
  const s = status.toLowerCase();
  if (s === 'lunas') return { bg: '#ecfdf5', fg: '#065f46', label: 'Lunas' };
  if (s === 'sebagian' || s === 'cicil') {
    return { bg: '#fef3c7', fg: '#b45309', label: 'Sebagian' };
  }
  return { bg: '#fef2f2', fg: '#b91c1c', label: 'Belum Lunas' };
}

export default function SiswaKeuanganScreen() {
  const [tab, setTab] = useState<'tagihan' | 'tabungan'>('tagihan');
  const [data, setData] = useState<SiswaKeuanganResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await apiRequest<SiswaKeuanganResponse>('/siswa/keuangan');
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

  return (
    <View style={styles.container}>
      <TabHeader
        title="Keuangan Siswa"
        subtitle="Rincian tagihan sekolah dan mutasi buku tabungan"
      />

      <View style={styles.segmentWrap}>
        <Pressable
          style={[styles.segmentBtn, tab === 'tagihan' && styles.segmentBtnActive]}
          onPress={() => setTab('tagihan')}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={tab === 'tagihan' ? '#ffffff' : '#065f46'}
          />
          <Text style={[styles.segmentText, tab === 'tagihan' && styles.segmentTextActive]}>
            Tagihan
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, tab === 'tabungan' && styles.segmentBtnActive]}
          onPress={() => setTab('tabungan')}
        >
          <Ionicons
            name="wallet-outline"
            size={16}
            color={tab === 'tabungan' ? '#ffffff' : '#065f46'}
          />
          <Text style={[styles.segmentText, tab === 'tabungan' && styles.segmentTextActive]}>
            Buku Tabungan
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
        ) : tab === 'tagihan' ? (
          <>
            <AnimatedCard index={0} style={[styles.card, { marginBottom: 12 }]}>
              <Text style={styles.bannerLabel}>Total Sisa Tagihan</Text>
              <Text
                style={[
                  styles.bannerValue,
                  { color: (data?.total_sisa_tagihan ?? 0) > 0 ? '#b45309' : '#065f46' },
                ]}
              >
                {formatRupiah(data?.total_sisa_tagihan ?? 0)}
              </Text>
            </AnimatedCard>

            {(data?.tagihan?.length ?? 0) === 0 ? (
              <AnimatedCard index={1} style={styles.card}>
                <Text style={styles.emptyText}>Belum ada data tagihan untuk siswa ini.</Text>
              </AnimatedCard>
            ) : (
              data?.tagihan.map((item, idx) => {
                const badge = tagihanStatusStyle(item.status);
                return (
                  <AnimatedCard key={item.id} index={idx + 1} style={[styles.card, { marginBottom: 10 }]}>
                    <View style={styles.rowTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.nama}</Text>
                        <Text style={styles.itemMeta}>
                          {item.periode ?? '-'}
                          {item.jatuh_tempo ? ` • Jatuh tempo: ${item.jatuh_tempo}` : ''}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.label}</Text>
                      </View>
                    </View>

                    <View style={styles.amountGrid}>
                      <View style={styles.amountCol}>
                        <Text style={styles.amountLabel}>Nominal</Text>
                        <Text style={styles.amountVal}>{formatRupiah(item.nominal)}</Text>
                      </View>
                      <View style={styles.amountCol}>
                        <Text style={styles.amountLabel}>Terbayar</Text>
                        <Text style={[styles.amountVal, { color: '#065f46' }]}>
                          {formatRupiah(item.terbayar)}
                        </Text>
                      </View>
                      <View style={styles.amountCol}>
                        <Text style={styles.amountLabel}>Sisa</Text>
                        <Text
                          style={[
                            styles.amountVal,
                            { color: item.sisa > 0 ? '#b91c1c' : '#065f46' },
                          ]}
                        >
                          {formatRupiah(item.sisa)}
                        </Text>
                      </View>
                    </View>
                  </AnimatedCard>
                );
              })
            )}
          </>
        ) : (
          <>
            <AnimatedCard index={0} style={[styles.card, { marginBottom: 12 }]}>
              <Text style={styles.bannerLabel}>Saldo Buku Tabungan</Text>
              <Text style={[styles.bannerValue, { color: '#065f46' }]}>
                {formatRupiah(data?.saldo_tabungan ?? 0)}
              </Text>
            </AnimatedCard>

            {(data?.tabungan?.length ?? 0) === 0 ? (
              <AnimatedCard index={1} style={styles.card}>
                <Text style={styles.emptyText}>Belum ada transaksi tabungan tercatat.</Text>
              </AnimatedCard>
            ) : (
              data?.tabungan.map((item, idx) => {
                const isSetor = item.jenis === 'setor';
                return (
                  <AnimatedCard key={item.id} index={idx + 1} style={[styles.card, { marginBottom: 10 }]}>
                    <View style={styles.ledgerRow}>
                      <View
                        style={[
                          styles.ledgerIcon,
                          { backgroundColor: isSetor ? '#ecfdf5' : '#fef2f2' },
                        ]}
                      >
                        <Ionicons
                          name={isSetor ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                          size={20}
                          color={isSetor ? '#065f46' : '#b91c1c'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>
                          {isSetor ? 'Setoran Tabungan' : 'Penarikan Tabungan'}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {item.tanggal ?? '-'}
                          {item.keterangan ? ` • ${item.keterangan}` : ''}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.ledgerAmount,
                          { color: isSetor ? '#065f46' : '#b91c1c' },
                        ]}
                      >
                        {isSetor ? '+' : '-'}
                        {formatRupiah(item.nominal)}
                      </Text>
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
  bannerLabel: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  bannerValue: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  itemMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  amountGrid: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  amountCol: { flex: 1 },
  amountLabel: { fontSize: 11, color: '#64748b' },
  amountVal: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 2 },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ledgerIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerAmount: { fontSize: 14, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 13, paddingVertical: 12 },
});
