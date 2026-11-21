import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedCard } from '@/src/components/AnimatedCard';
import { apiRequest, OrganisasiResponse } from '@/src/lib/api';

export default function OrganisasiScreen() {
  const [data, setData] = useState<OrganisasiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeEkskulId, setActiveEkskulId] = useState<number | null>(null);
  const [materi, setMateri] = useState('');
  const [jumlahHadir, setJumlahHadir] = useState('0');
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<OrganisasiResponse>('/guru/organisasi');
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSave() {
    if (!activeEkskulId || !materi.trim()) return;
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string }>('/guru/organisasi/kegiatan', {
        method: 'POST',
        body: {
          ekstrakurikuler_id: activeEkskulId,
          tanggal: data?.tanggal,
          materi: materi.trim(),
          jumlah_hadir: Number(jumlahHadir) || 0,
          catatan: catatan.trim() || null,
        },
      });
      setActiveEkskulId(null);
      setMateri('');
      setCatatan('');
      Alert.alert('Berhasil', res.message);
      await loadData();
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal menyimpan kegiatan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading ? (
        <ActivityIndicator size="large" color="#065f46" style={{ marginTop: 32 }} />
      ) : data && data.ekskul.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={28} color="#d97706" />
          <Text style={styles.emptyText}>Anda belum ditugaskan sebagai pembina ekstrakurikuler.</Text>
        </View>
      ) : (
        data?.ekskul.map((ek, idx) => (
          <AnimatedCard key={ek.id} index={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{ek.nama}</Text>
                <Text style={styles.sub}>{ek.anggota_count} anggota aktif</Text>
              </View>
              <Pressable style={styles.addBtn} onPress={() => setActiveEkskulId(ek.id)}>
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.addBtnText}>Catat</Text>
              </Pressable>
            </View>

            {ek.kegiatan.length === 0 ? (
              <Text style={styles.emptySub}>Belum ada catatan kegiatan.</Text>
            ) : (
              ek.kegiatan.map((k) => (
                <View key={k.id} style={styles.kegiatanItem}>
                  <Text style={styles.kegiatanDate}>
                    {k.tanggal} · Hadir {k.jumlah_hadir} siswa
                  </Text>
                  <Text style={styles.kegiatanMateri}>{k.materi}</Text>
                </View>
              ))
            )}
          </AnimatedCard>
        ))
      )}

      <Modal
        visible={activeEkskulId !== null}
        animationType="slide"
        onRequestClose={() => setActiveEkskulId(null)}
      >
        <ScrollView style={styles.modalContainer} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Catat Kegiatan Ekstrakurikuler</Text>
          <Text style={styles.label}>Materi / Kegiatan</Text>
          <TextInput style={styles.input} value={materi} onChangeText={setMateri} placeholder="Contoh: Latihan PBB" />
          <Text style={styles.label}>Jumlah Hadir</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={jumlahHadir}
            onChangeText={setJumlahHadir}
          />
          <Text style={styles.label}>Catatan (opsional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            multiline
            value={catatan}
            onChangeText={setCatatan}
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setActiveEkskulId(null)}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'Menyimpan...' : 'Simpan'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  emptySub: { fontSize: 13, color: '#94a3b8' },
  kegiatanItem: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 8,
  },
  kegiatanDate: { fontSize: 12, color: '#0f766e', fontWeight: '600' },
  kegiatanMateri: { fontSize: 14, color: '#0f172a', marginTop: 2 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: '#334155' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveText: { fontWeight: '700', color: '#ffffff' },
});
