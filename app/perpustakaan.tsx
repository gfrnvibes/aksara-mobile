import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
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
          <View style={styles.grid}>
            {data?.buku.map((item, idx) => (
              <AnimatedCard
                key={item.id}
                index={idx}
                style={styles.card}
                contentStyle={styles.cardInner}
                onPress={() => handleBacaPdf(item)}
              >
                {item.sampul_url ? (
                  <Image
                    source={{ uri: item.sampul_url }}
                    style={styles.coverImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Ionicons name="book" size={30} color="#fde68a" />
                    <Text style={styles.coverPlaceholderTitle}>E-BOOK PDF</Text>
                  </View>
                )}

                <View style={styles.topBadges}>
                  <View style={styles.katBadge}>
                    <Text style={styles.katBadgeText} numberOfLines={1}>
                      {item.kategori_label}
                    </Text>
                  </View>
                  {item.tingkat !== null ? (
                    <View style={styles.kelasBadge}>
                      <Text style={styles.kelasBadgeText}>{item.tingkat_label}</Text>
                    </View>
                  ) : null}
                </View>

                <LinearGradient
                  colors={['rgba(6, 78, 59, 0)', 'rgba(6, 78, 59, 0.76)', 'rgba(6, 78, 59, 0.96)']}
                  locations={[0, 0.42, 1]}
                  style={styles.bottomOverlay}
                >
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {item.judul}
                  </Text>
                  <Text style={styles.bookMeta} numberOfLines={1}>
                    {item.penulis || 'Tim Penyusun'}
                  </Text>
                  {item.mapel ? (
                    <Text style={styles.mapelText} numberOfLines={1}>
                      {item.mapel}
                    </Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <View style={styles.readCount}>
                      <Ionicons name="eye-outline" size={12} color="#d1fae5" />
                      <Text style={styles.readCountText}>{item.jumlah_dibaca}</Text>
                    </View>
                    <View style={styles.bacaBtn}>
                      <Ionicons name="book-outline" size={12} color="#064e3b" />
                      <Text style={styles.bacaBtnText}>Baca</Text>
                    </View>
                  </View>
                </LinearGradient>
              </AnimatedCard>
            ))}
          </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48.5%',
    aspectRatio: 0.72,
    backgroundColor: '#064e3b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  coverImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#065f46',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 68,
    gap: 6,
  },
  coverPlaceholderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d1fae5',
    letterSpacing: 1,
  },
  topBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    zIndex: 2,
  },
  katBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: '58%',
  },
  katBadgeText: { fontSize: 9, fontWeight: '700', color: '#065f46' },
  kelasBadge: {
    backgroundColor: '#065f46',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  kelasBadgeText: { fontSize: 9, fontWeight: '700', color: '#ffffff' },
  bottomOverlay: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 42,
    zIndex: 2,
  },
  bookTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff', lineHeight: 17 },
  bookMeta: { fontSize: 10, color: '#d1fae5', marginTop: 2 },
  mapelText: { fontSize: 10, fontWeight: '700', color: '#fde68a', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
  },
  readCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readCountText: { fontSize: 11, color: '#ecfdf5', fontWeight: '600' },
  bacaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  bacaBtnText: { color: '#064e3b', fontSize: 11, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 13, paddingVertical: 12 },
});
