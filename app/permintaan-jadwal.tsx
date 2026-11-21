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
import { apiRequest, PermintaanJadwalResponse } from '@/src/lib/api';

export default function PermintaanJadwalScreen() {
  const [data, setData] = useState<PermintaanJadwalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [jenis, setJenis] = useState('tidak_bisa');
  const [sifat, setSifat] = useState('');
  const [selectedHari, setSelectedHari] = useState<number[]>([]);
  const [keterangan, setKeterangan] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<PermintaanJadwalResponse>('/guru/permintaan-jadwal');
      setData(res);
      setJenis(Object.keys(res.jenis_opsi)[0] ?? 'tidak_bisa');
      setSifat(Object.keys(res.sifat_opsi)[0] ?? '');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleHari(h: number) {
    setSelectedHari((prev) => (prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiRequest<{ message: string }>('/guru/permintaan-jadwal', {
        method: 'POST',
        body: {
          jenis,
          sifat,
          hari: selectedHari,
          keterangan: keterangan.trim() || null,
        },
      });
      setShowModal(false);
      setKeterangan('');
      setSelectedHari([]);
      Alert.alert('Berhasil', res.message);
      await loadData();
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal menyimpan permintaan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiRequest(`/guru/permintaan-jadwal/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal menghapus.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.primaryBtn} onPress={() => setShowModal(true)}>
        <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
        <Text style={styles.primaryText}>Tambah Permintaan Jadwal</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" color="#065f46" style={{ marginTop: 32 }} />
      ) : data && data.items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Belum ada permintaan atau preferensi jadwal.</Text>
        </View>
      ) : (
        data?.items.map((item, idx) => (
          <AnimatedCard key={item.id} index={idx} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>{item.jenis_label}</Text>
              <Pressable onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
              </Pressable>
            </View>
            <Text style={styles.meta}>{item.sifat_label}</Text>
            {item.keterangan && <Text style={styles.note}>{item.keterangan}</Text>}
          </AnimatedCard>
        ))
      )}

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <ScrollView style={styles.modalContainer} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Tambah Permintaan Jadwal</Text>

          <Text style={styles.label}>Jenis</Text>
          <View style={styles.wrapRow}>
            {data &&
              Object.entries(data.jenis_opsi).map(([val, label]) => (
                <Pressable
                  key={val}
                  style={[styles.pill, jenis === val && styles.pillActive]}
                  onPress={() => setJenis(val)}
                >
                  <Text style={[styles.pillText, jenis === val && styles.pillTextActive]}>{label}</Text>
                </Pressable>
              ))}
          </View>

          <Text style={styles.label}>Sifat</Text>
          <View style={styles.wrapRow}>
            {data &&
              Object.entries(data.sifat_opsi).map(([val, label]) => (
                <Pressable
                  key={val}
                  style={[styles.pill, sifat === val && styles.pillActive]}
                  onPress={() => setSifat(val)}
                >
                  <Text style={[styles.pillText, sifat === val && styles.pillTextActive]}>{label}</Text>
                </Pressable>
              ))}
          </View>

          <Text style={styles.label}>Hari</Text>
          <View style={styles.wrapRow}>
            {data &&
              Object.entries(data.hari_opsi).map(([val, label]) => {
                const hNum = Number(val);
                const active = selectedHari.includes(hNum);
                return (
                  <Pressable
                    key={val}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => toggleHari(hNum)}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
          </View>

          <Text style={styles.label}>Keterangan</Text>
          <TextInput
            style={styles.input}
            value={keterangan}
            onChangeText={setKeterangan}
            placeholder="Alasan / catatan tambahan"
          />

          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setShowModal(false)}>
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
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#065f46',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 12, color: '#065f46', fontWeight: '600', marginTop: 3 },
  note: { fontSize: 13, color: '#475569', marginTop: 6 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  pillActive: { backgroundColor: '#065f46', borderColor: '#065f46' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  pillTextActive: { color: '#ffffff' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    marginBottom: 14,
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
