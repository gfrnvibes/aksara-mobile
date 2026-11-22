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
import { apiRequest, SiswaCatatanResponse } from '@/src/lib/api';

export default function SiswaCatatanScreen() {
  const [tab, setTab] = useState<'prestasi' | 'pelanggaran'>('prestasi');
  const [data, setData] = useState<SiswaCatatanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await apiRequest<SiswaCatatanResponse>('/siswa/catatan');
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
        title="Catatan Siswa"
        subtitle="Prestasi akademik/non-akademik dan catatan kedisiplinan"
      />

      <View style={styles.segmentWrap}>
        <Pressable
          style={[styles.segmentBtn, tab === 'prestasi' && styles.segmentBtnActive]}
          onPress={() => setTab('prestasi')}
        >
          <Ionicons
            name="medal-outline"
            size={16}
            color={tab === 'prestasi' ? '#ffffff' : '#065f46'}
          />
          <Text style={[styles.segmentText, tab === 'prestasi' && styles.segmentTextActive]}>
            Prestasi ({data?.prestasi?.length ?? 0})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, tab === 'pelanggaran' && styles.segmentBtnActive]}
          onPress={() => setTab('pelanggaran')}
        >
          <Ionicons
            name="warning-outline"
            size={16}
            color={tab === 'pelanggaran' ? '#ffffff' : '#065f46'}
          />
          <Text style={[styles.segmentText, tab === 'pelanggaran' && styles.segmentTextActive]}>
            Pelanggaran ({data?.pelanggaran?.length ?? 0})
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
        ) : tab === 'prestasi' ? (
          (data?.prestasi?.length ?? 0) === 0 ? (
            <AnimatedCard index={0} style={styles.card}>
              <Text style={styles.emptyText}>Belum ada catatan prestasi.</Text>
            </AnimatedCard>
          ) : (
            data?.prestasi.map((item, idx) => (
              <AnimatedCard key={item.id} index={idx} style={[styles.card, { marginBottom: 10 }]}>
                <View style={styles.itemHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="trophy" size={18} color="#b45309" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.nama_prestasi}</Text>
                    <Text style={styles.itemMeta}>
                      {item.tanggal ?? '-'}
                      {item.tingkat ? ` • Tingkat ${item.tingkat}` : ''}
                    </Text>
                  </View>
                  {item.peringkat ? (
                    <View style={[styles.badge, { backgroundColor: '#ecfdf5' }]}>
                      <Text style={[styles.badgeText, { color: '#065f46' }]}>
                        {item.peringkat}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {item.penyelenggara ? (
                  <Text style={styles.detailText}>Penyelenggara: {item.penyelenggara}</Text>
                ) : null}
                {item.keterangan ? (
                  <Text style={styles.detailText}>{item.keterangan}</Text>
                ) : null}
              </AnimatedCard>
            ))
          )
        ) : (
          <>
            <AnimatedCard index={0} style={[styles.card, { marginBottom: 12 }]}>
              <View style={styles.poinBanner}>
                <View>
                  <Text style={styles.poinLabel}>Total Poin Pelanggaran</Text>
                  <Text style={styles.poinSub}>Akumulasi poin kedisiplinan tercatat</Text>
                </View>
                <View
                  style={[
                    styles.poinCircle,
                    {
                      backgroundColor:
                        (data?.total_poin_pelanggaran ?? 0) > 0 ? '#fef2f2' : '#ecfdf5',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.poinNum,
                      {
                        color:
                          (data?.total_poin_pelanggaran ?? 0) > 0 ? '#b91c1c' : '#065f46',
                      },
                    ]}
                  >
                    {data?.total_poin_pelanggaran ?? 0}
                  </Text>
                </View>
              </View>
            </AnimatedCard>

            {(data?.pelanggaran?.length ?? 0) === 0 ? (
              <AnimatedCard index={1} style={styles.card}>
                <Text style={styles.emptyText}>
                  Alhamdulillah, tidak ada catatan pelanggaran.
                </Text>
              </AnimatedCard>
            ) : (
              data?.pelanggaran.map((item, idx) => (
                <AnimatedCard key={item.id} index={idx + 1} style={[styles.card, { marginBottom: 10 }]}>
                  <View style={styles.itemHeader}>
                    <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
                      <Ionicons name="alert-circle" size={18} color="#b91c1c" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.pelanggaran}</Text>
                      <Text style={styles.itemMeta}>
                        {item.tanggal ?? '-'}
                        {item.kategori ? ` • ${item.kategori}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#fef2f2' }]}>
                      <Text style={[styles.badgeText, { color: '#b91c1c' }]}>
                        +{item.poin} poin
                      </Text>
                    </View>
                  </View>
                  {item.tindak_lanjut ? (
                    <Text style={styles.detailText}>Tindak Lanjut: {item.tindak_lanjut}</Text>
                  ) : null}
                  {item.status ? (
                    <Text style={styles.statusFoot}>Status: {item.status}</Text>
                  ) : null}
                </AnimatedCard>
              ))
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
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  itemMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  detailText: { fontSize: 12, color: '#475569', marginTop: 8, lineHeight: 17 },
  statusFoot: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '600' },
  poinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poinLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  poinSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  poinCircle: {
    minWidth: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  poinNum: { fontSize: 18, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 13, paddingVertical: 12 },
});
