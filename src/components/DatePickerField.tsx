import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

function parseIsoDate(iso: string): Date {
  const parts = iso.split('-').map((n) => Number(n));
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(iso: string): string {
  const date = parseIsoDate(iso);
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DatePickerField({
  value,
  onChange,
  maximumDate,
}: {
  value: string;
  onChange: (isoDate: string) => void;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const currentDate = parseIsoDate(value);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    onChange(toIsoDate(selected));
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.field}>
        <Ionicons name="calendar-outline" size={18} color="#065f46" />
        <input
          type="date"
          value={value}
          max={maximumDate ? toIsoDate(maximumDate) : undefined}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 14,
            color: '#0f172a',
            flex: 1,
            outline: 'none',
          }}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Ionicons name="calendar-outline" size={18} color="#065f46" />
        <Text style={styles.valueText}>{formatDisplayDate(value)}</Text>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </Pressable>

      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                maximumDate={maximumDate}
                onChange={handleChange}
              />
              <Pressable style={styles.doneBtn} onPress={() => setOpen(false)}>
                <Text style={styles.doneText}>Selesai</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 28,
  },
  doneBtn: {
    backgroundColor: '#065f46',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  doneText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});
