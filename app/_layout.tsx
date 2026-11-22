import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { IslamicPattern } from '@/src/components/IslamicPattern';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function BiometricLockScreen() {
  const { user, unlockWithBiometric, logout } = useAuth();

  useEffect(() => {
    unlockWithBiometric();
  }, [unlockWithBiometric]);

  return (
    <LinearGradient colors={['#064e3b', '#065f46', '#0f766e']} style={styles.lockContainer}>
      <IslamicPattern opacity={0.18} />
      <View style={styles.lockCard}>
        <View style={styles.lockIconCircle}>
          <Ionicons name="finger-print" size={44} color="#fde68a" />
        </View>
        <Text style={styles.lockTitle}>Aksara Terkunci</Text>
        <Text style={styles.lockSub}>
          Verifikasi biometrik untuk melanjutkan sebagai {user?.gtk?.nama ?? user?.name}
        </Text>

        <Pressable style={styles.unlockBtn} onPress={unlockWithBiometric}>
          <Ionicons name="lock-open-outline" size={18} color="#064e3b" />
          <Text style={styles.unlockText}>Buka Kunci Biometrik</Text>
        </Pressable>

        <Pressable style={styles.logoutLink} onPress={logout}>
          <Text style={styles.logoutLinkText}>Keluar dari Akun</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function RootLayoutNav() {
  const { user, loading, biometricLocked } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <LinearGradient colors={['#064e3b', '#065f46', '#0f766e']} style={styles.loadingContainer}>
        <IslamicPattern opacity={0.18} />
        <View style={styles.loadingLogoWrap}>
          <Image
            source={require('@/assets/images/logo-attaufiq.png')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loadingTitle}>Aksara At-Taufiq</Text>
        <Text style={styles.loadingSub}>Portal Mobile Guru & Wali Kelas</Text>
        <ActivityIndicator size="large" color="#fde68a" style={{ marginTop: 24 }} />
      </LinearGradient>
    );
  }

  if (user && biometricLocked) {
    return <BiometricLockScreen />;
  }

  const inAuthRoute = segments[0] === 'login';
  const inSiswaTabs = segments[0] === '(siswa)';
  const inSharedRoute =
    segments[0] === 'profil' || segments[0] === 'perpustakaan';
  const isSiswa = user?.role === 'siswa';

  return (
    <>
      {!user && !inAuthRoute && <Redirect href="/login" />}
      {user && isSiswa && !inSiswaTabs && !inSharedRoute && <Redirect href={'/(siswa)' as never} />}
      {user && !isSiswa && (inAuthRoute || inSiswaTabs) && <Redirect href="/(tabs)" />}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#064e3b' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(siswa)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="nilai" options={{ title: 'Input Nilai' }} />
        <Stack.Screen name="leger" options={{ title: 'Leger Kelas Saya' }} />
        <Stack.Screen name="rapor" options={{ title: 'Rapor Kelas Saya' }} />
        <Stack.Screen name="perangkat" options={{ title: 'Perangkat & Tugas' }} />
        <Stack.Screen name="organisasi" options={{ title: 'Organisasi & Ekskul' }} />
        <Stack.Screen name="piket" options={{ title: 'Kehadiran GTK & Piket' }} />
        <Stack.Screen name="presensi-lokasi" options={{ title: 'Presensi Lokasi & Foto' }} />
        <Stack.Screen name="permintaan-jadwal" options={{ title: 'Permintaan Jadwal' }} />
        <Stack.Screen name="keuangan-guru" options={{ title: 'Keuangan Guru' }} />
        <Stack.Screen name="perpustakaan" options={{ title: 'Perpustakaan Digital' }} />
        <Stack.Screen name="profil" options={{ title: 'Profil & Pengaturan' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.35)',
  },
  lockIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockTitle: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  lockSub: {
    color: '#d1fae5',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
    width: '100%',
  },
  unlockText: { color: '#064e3b', fontWeight: '800', fontSize: 15 },
  logoutLink: { marginTop: 18, padding: 6 },
  logoutLinkText: { color: '#fde68a', fontWeight: '600', fontSize: 13 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingLogoWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 2,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 16,
  },
  loadingLogo: {
    width: 76,
    height: 76,
  },
  loadingTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  loadingSub: {
    color: '#d1fae5',
    fontSize: 13,
    marginTop: 4,
  },
});
