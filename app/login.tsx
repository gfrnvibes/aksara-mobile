import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { IslamicPattern } from '@/src/components/IslamicPattern';
import { useAuth } from '@/src/context/AuthContext';
import { getApiUrl, setApiUrl } from '@/src/lib/api';

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiUrl, setApiUrlInput] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getApiUrl().then(setApiUrlInput);
  }, []);

  async function handleSubmit() {
    if (!identifier.trim() || !password) {
      setError('Masukkan NIP / NUPTK / No. HP / Email dan password.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await setApiUrl(apiUrl);
      await login(identifier.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk ke server Aksara.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#064e3b', '#065f46', '#0f766e']} style={styles.hero}>
          <IslamicPattern opacity={0.18} />
          <Animated.View entering={FadeInDown.duration(400)} style={styles.heroInner}>
            <View style={styles.iconCircle}>
              <Ionicons name="moon" size={26} color="#fbbf24" />
            </View>
            <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
            <Text style={styles.heroTitle}>Aksara Madrasah</Text>
            <Text style={styles.heroSubtitle}>Portal Mobile Guru & Wali Kelas</Text>
          </Animated.View>
        </LinearGradient>

        <Animated.View entering={FadeInUp.delay(120).duration(400)} style={styles.card}>
          <Text style={styles.cardTitle}>Assalamu&apos;alaikum</Text>
          <Text style={styles.cardSubtitle}>
            Masuk menggunakan NIP, NUPTK, nomor HP, atau email Anda.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#b91c1c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Identitas Login</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="NIP / NUPTK / No. HP / Email"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Masukkan password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#64748b"
              />
            </Pressable>
          </View>

          <Pressable
            style={styles.serverToggle}
            onPress={() => setShowServerConfig((prev) => !prev)}
          >
            <Ionicons name="server-outline" size={15} color="#0f766e" />
            <Text style={styles.serverToggleText}>
              {showServerConfig ? 'Sembunyikan alamat server API' : 'Atur alamat server API'}
            </Text>
          </Pressable>

          {showServerConfig && (
            <View style={styles.serverBox}>
              <Text style={styles.label}>URL API Aksara</Text>
              <TextInput
                style={styles.serverInput}
                value={apiUrl}
                onChangeText={setApiUrlInput}
                placeholder="http://192.168.0.103:8000/api/v1"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helperText}>
                HP fisik: gunakan IP LAN PC (contoh http://192.168.0.103:8000/api/v1).
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.buttonWrap, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#065f46', '#0f766e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Masuk ke Portal Guru</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fbbf24" />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  scrollContent: { flexGrow: 1 },
  hero: {
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroInner: { alignItems: 'center' },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bismillah: {
    color: '#fde68a',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#d1fae5',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 18,
    marginTop: -28,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#064e3b',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  eyeBtn: { padding: 4 },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  serverToggleText: { fontSize: 13, color: '#0f766e', fontWeight: '600' },
  serverBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serverInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  helperText: { fontSize: 12, color: '#64748b' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { flex: 1, color: '#b91c1c', fontSize: 13 },
  buttonWrap: { marginTop: 6, borderRadius: 12, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.7 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
