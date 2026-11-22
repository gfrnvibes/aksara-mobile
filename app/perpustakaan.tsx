import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedCard } from '@/src/components/AnimatedCard';
import {
  apiRequest,
  getApiUrl,
  PerpustakaanBukuItem,
  PerpustakaanResponse,
  resolveMediaUrl,
} from '@/src/lib/api';

export default function PerpustakaanScreen() {
  const [data, setData] = useState<PerpustakaanResponse | null>(null);
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [tingkat, setTingkat] = useState('');
  const [activeApiUrl, setActiveApiUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getApiUrl().then(setActiveApiUrl);
  }, []);

  const loadData = useCallback(async (qVal: string, katVal: string, tingVal: string) => {
    try {
      const params = new URLSearchParams();
      if (qVal.trim()) params.set('q', qVal.trim());
      if (katVal) params.set('kategori', katVal);
      if (tingVal) params.set('tingkat', tingVal);
      const qs = params.toString();
      const res = await apiRequest<PerpustakaanResponse>(
        `/perpustakaan${qs ? `?${qs}` : ''}`,
      );
      setData(res);
    } catch (e) {
      Alert.alert('Gagal Memuat', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(search, kategori, tingkat);
  }, [kategori, tingkat, loadData]);

  async function handleBacaPdf(item: PerpustakaanBukuItem) {
    try {
      const url = activeApiUrl ? resolveMediaUrl(item.baca_url, activeApiUrl) : item.baca_url;
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert('Gagal Membuka PDF', e instanceof Error ? e.message : 'Tidak dapat membuka file.');
    }
  }

  const kategoriEntries = Object.entries(data?.kategori_opsi ?? {});
  const tingkatEntries = Object.entries(data?.tingkat_opsi ?? {});

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari judul, penulis, atau ISBN..."
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
            onSubmitEditing={() => {
              setLoading(true);
              loadData(search, kategori, tingkat);
            }}
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => {
                setSearch('');
                setLoading(true);
                loadData('', kategori, tingkat);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Pressable
            style={[styles.chip, kategori === '' && styles.chipActive]}
            onPress={() => setKategori('')}
          >
            <Text style={[styles.chipText, kategori === '' && styles.chipTextActive]}>
              Semua Kategori
            </Text>
          </Pressable>
          {kategoriEntries.map(([key, label]) => (
            <Pressable
              key={key}
              style={[styles.chip, kategori === key && styles.chipActive]}
              onPress={() => setKategori(key)}
            >
              <Text style={[styles.chipText, kategori === key && styles.chipTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {tingkatEntries.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <Pressable
              style={[styles.chip, tingkat === '' && styles.chipActive]}
              onPress={() => setTingkat('')}
            >
              <Text style={[styles.chipText, tingkat === '' && styles.chipTextActive]}>
                Semua Kelas
              </Text>
            </Pressable>
            {tingkatEntries.map(([key, label]) => (
              <Pressable
                key={key}
                style={[styles.chip, tingkat === key && styles.chipActive]}
                onPress={() => setTingkat(key)}
              >
                <Text style={[styles.chipText, tingkat === key && styles.chipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData(search, kategori, tingkat);
            }}
            tintColor="#065f46"
          />
        }
      >
        {loading && !data ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#065f46" />
            <Text style={styles.loaderText}>Memuat koleksi perpustakaan...</Text>
          </View>
        ) : (data?.buku?.length ?? 0) === 0 ? (
          <AnimatedCard index={0} style={styles.card}>
            <Text style={styles.emptyText}>Belum ada buku digital yang sesuai filter.</Text>
          </AnimatedCard>
        ) : (
          data?.buku.map((item, idx) => (
            <AnimatedCard key={item.id} index={idx} style={styles.card}>
              <View style={styles.bookRow}>
                {item.sampul_url ? (
                  <Image source={{ uri: item.sampul_url }} style={styles.coverImg} />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Ionicons name="book" size={26} color="#065f46" />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <View style={styles.katBadge}>
                      <Text style={styles.katBadgeText}>{item.kategori_label}</Text>
                    </View>
                    {item.tingkat !== null ? (
                      <View style={styles.kelasBadge}>
                        <Text style={styles.kelasBadgeText}>{item.tingkat_label}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.bookTitle}>{item.judul}</Text>
                  <Text style={styles.bookMeta}>
                    {item.penulis || 'Tim Penyusun'}
                    {item.tahun_terbit ? ` • ${item.tahun_terbit}` : ''}
                  </Text>
                  {item.mapel ? (
                    <Text style={styles.mapelText}>Mapel: {item.mapel}</Text>
                  ) : null}
                  {item.deskripsi ? (
                    <Text style={styles.descText} numberOfLines={2}>
                      {item.deskripsi}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.readCount}>
                  <Ionicons name="eye-outline" size={14} color="#64748b" />
                  <Text style={styles.readCountText}>{item.jumlah_dibaca}x dibaca</Text>
                </View>
                <Pressable style={styles.bacaBtn} onPress={() => handleBacaPdf(item)}>
                  <Ionicons name="document-text-outline" size={16} color="#ffffff" />
                  <Text style={styles.bacaBtnText}>Baca PDF</Text>
                </Pressable>
              </View>
            </AnimatedCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  searchSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipActive: { backgroundColor: '#065f46', borderColor: '#065f46' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  chipTextActive: { color: '#ffffff' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  loaderBox: { padding: 48, alignItems: 'center', gap: 10 },
  loaderText: { color: '#64748b', fontSize: 13 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  bookRow: { flexDirection: 'row', gap: 12 },
  coverImg: { width: 72, height: 96, borderRadius: 10, backgroundColor: '#e2e8f0' },
  coverPlaceholder: {
    width: 72,
    height: 96,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  katBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  katBadgeText: { fontSize: 10, fontWeight: '700', color: '#065f46' },
  kelasBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kelasBadgeText: { fontSize: 10, fontWeight: '700', color: '#b45309' },
  bookTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  bookMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  mapelText: { fontSize: 11, fontWeight: '600', color: '#0f766e', marginTop: 2 },
  descText: { fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 17 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  readCount: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  readCountText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  bacaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#065f46',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bacaBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 13, paddingVertical: 12 },
});
