import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const TAB_ORDER = [
  '/(tabs)',
  '/(tabs)/jadwal',
  '/(tabs)/presensi',
  '/(tabs)/jurnal',
  '/(tabs)/lainnya',
] as const;

export type TabKey = 'index' | 'jadwal' | 'presensi' | 'jurnal' | 'lainnya';

const KEY_TO_INDEX: Record<TabKey, number> = {
  index: 0,
  jadwal: 1,
  presensi: 2,
  jurnal: 3,
  lainnya: 4,
};

let lastSwipeDirection: 'next' | 'prev' = 'next';

export function SwipeTabScreen({
  current,
  children,
}: {
  current: TabKey;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentRef = useRef(current);
  currentRef.current = current;
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      translateX.value = lastSwipeDirection === 'next' ? 28 : -28;
      opacity.value = 0.85;
      translateX.value = withTiming(0, { duration: 180 });
      opacity.value = withTiming(1, { duration: 180 });
    }, [translateX, opacity]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 28 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.6,
        onPanResponderRelease: (_, gesture) => {
          const idx = KEY_TO_INDEX[currentRef.current];
          if (gesture.dx < -60 && idx + 1 < TAB_ORDER.length) {
            lastSwipeDirection = 'next';
            router.navigate(TAB_ORDER[idx + 1] as never);
          } else if (gesture.dx > 60 && idx - 1 >= 0) {
            lastSwipeDirection = 'prev';
            router.navigate(TAB_ORDER[idx - 1] as never);
          }
        },
      }),
    [router],
  );

  return (
    <View style={styles.flex} {...panResponder.panHandlers}>
      <Animated.View style={[styles.flex, animatedStyle]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f6f8f6' },
});
