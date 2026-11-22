import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IslamicPattern } from './IslamicPattern';

export function TabHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#064e3b', '#065f46', '#0f766e']}
      style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}
    >
      <IslamicPattern opacity={0.14} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#d1fae5',
    fontSize: 12,
    marginTop: 2,
  },
});
