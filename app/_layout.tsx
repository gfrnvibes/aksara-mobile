import { useFonts } from 'expo-font';
import { Redirect, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

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

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f8f6' }}>
        <ActivityIndicator size="large" color="#065f46" />
      </View>
    );
  }

  const inAuthRoute = segments[0] === 'login';

  return (
    <>
      {!user && !inAuthRoute && <Redirect href="/login" />}
      {user && inAuthRoute && <Redirect href="/(tabs)" />}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#064e3b' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="nilai" options={{ title: 'Input Nilai' }} />
        <Stack.Screen name="leger" options={{ title: 'Leger Kelas Saya' }} />
        <Stack.Screen name="rapor" options={{ title: 'Rapor Kelas Saya' }} />
        <Stack.Screen name="perangkat" options={{ title: 'Perangkat & Tugas' }} />
        <Stack.Screen name="organisasi" options={{ title: 'Organisasi & Ekskul' }} />
        <Stack.Screen name="piket" options={{ title: 'Kehadiran GTK & Piket' }} />
        <Stack.Screen name="presensi-lokasi" options={{ title: 'Presensi Lokasi & Foto' }} />
        <Stack.Screen name="permintaan-jadwal" options={{ title: 'Permintaan Jadwal' }} />
        <Stack.Screen name="profil" options={{ title: 'Profil & Pengaturan' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
