import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { IslamicPattern } from "@/src/components/IslamicPattern";
import { useAuth } from "@/src/context/AuthContext";
import { getApiUrl, setApiUrl } from "@/src/lib/api";

export default function LoginScreen() {
  const {
    login,
    loginSiswa,
    loginWithBiometric,
    biometricEnabled,
    biometricKind,
    hasBiometricCredentials,
  } = useAuth();
  const [loginMode, setLoginMode] = useState<"guru" | "siswa">("guru");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [apiUrl, setApiUrlInput] = useState("");
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getApiUrl().then(setApiUrlInput);
  }, []);

  async function handleSubmit() {
    if (!identifier.trim() || !password) {
      setError(
        loginMode === "siswa"
          ? "Masukkan NIS / NISN dan tanggal lahir (YYYY-MM-DD) atau password."
          : "Masukkan NIP / NUPTK / No. HP / Email dan password.",
      );
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await setApiUrl(apiUrl);
      if (loginMode === "siswa") {
        await loginSiswa(identifier.trim(), password);
      } else {
        await login(identifier.trim(), password);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal masuk ke server Aksara.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBiometricLogin() {
    setError(null);
    setSubmitting(true);
    try {
      await setApiUrl(apiUrl);
      await loginWithBiometric();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login biometrik gagal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 48 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#064e3b", "#065f46", "#0f766e"]}
          style={styles.hero}
        >
          <IslamicPattern opacity={0.18} />
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.heroInner}
          >
            <View style={styles.logoWrap}>
              <Image
                source={require("@/assets/images/logo-attaufiq.png")}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.bismillah}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
            <Text style={styles.heroTitle}>Aksara At-Taufiq</Text>
            <Text style={styles.heroSubtitle}>
              Portal Mobile Guru, Wali Kelas, dan Orang Tua
            </Text>
          </Animated.View>
        </LinearGradient>

        <Animated.View
          entering={FadeInUp.delay(120).duration(400)}
          style={styles.card}
        >
          <View style={styles.modeSwitch}>
            <Pressable
              style={[
                styles.modeBtn,
                loginMode === "guru" && styles.modeBtnActive,
              ]}
              onPress={() => {
                setLoginMode("guru");
                setError(null);
              }}
            >
              <Ionicons
                name="school-outline"
                size={16}
                color={loginMode === "guru" ? "#ffffff" : "#065f46"}
              />
              <Text
                style={[
                  styles.modeText,
                  loginMode === "guru" && styles.modeTextActive,
                ]}
              >
                Guru / GTK
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeBtn,
                loginMode === "siswa" && styles.modeBtnActive,
              ]}
              onPress={() => {
                setLoginMode("siswa");
                setError(null);
              }}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={loginMode === "siswa" ? "#ffffff" : "#065f46"}
              />
              <Text
                style={[
                  styles.modeText,
                  loginMode === "siswa" && styles.modeTextActive,
                ]}
              >
                Siswa / Orang Tua
              </Text>
            </Pressable>
          </View>

          <Text style={styles.cardSubtitle}>
            {loginMode === "siswa"
              ? "Masuk menggunakan NIS / NISN dan tanggal lahir (YYYY-MM-DD) atau password."
              : "Masuk menggunakan NIP, NUPTK, nomor HP, atau email Anda."}
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#b91c1c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>
            {loginMode === "siswa" ? "NIS / NISN" : "Identitas Login"}
          </Text>
          <View style={styles.inputWrap}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#64748b"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder={
                loginMode === "siswa"
                  ? "Contoh: 2025001 atau NISN"
                  : "NIP / NUPTK / No. HP / Email"
              }
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>
            {loginMode === "siswa" ? "Tanggal Lahir / Password" : "Password"}
          </Text>
          <View style={styles.inputWrap}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#64748b"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={
                loginMode === "siswa"
                  ? "YYYY-MM-DD (mis. 2010-05-14) atau password"
                  : "Masukkan password"
              }
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
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
              {showServerConfig
                ? "Sembunyikan alamat server API"
                : "Atur alamat server API"}
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
                HP fisik: gunakan IP LAN PC (contoh
                http://192.168.0.103:8000/api/v1).
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.buttonWrap, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={["#065f46", "#0f766e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {loginMode === "siswa"
                      ? "Masuk ke Portal Siswa"
                      : "Masuk ke Portal Guru"}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fbbf24" />
                </>
              )}
            </LinearGradient>
          </Pressable>

          {biometricEnabled &&
            hasBiometricCredentials && (
              <Pressable
                style={[styles.bioButton, submitting && styles.buttonDisabled]}
                onPress={handleBiometricLogin}
                disabled={submitting}
              >
                <Ionicons
                  name={
                    biometricKind === "face" ? "scan-outline" : "finger-print"
                  }
                  size={20}
                  color="#065f46"
                />
                <Text style={styles.bioButtonText}>
                  {biometricKind === "face"
                    ? "Masuk dengan Face ID"
                    : "Masuk dengan Sidik Jari"}
                </Text>
              </Pressable>
            )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f6" },
  scrollContent: { flexGrow: 1 },
  hero: {
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  heroInner: { alignItems: "center" },
  logoWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 2,
    borderColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    marginBottom: 12,
  },
  logoImg: {
    width: 62,
    height: 62,
  },
  bismillah: {
    color: "#fde68a",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#d1fae5",
    marginTop: 4,
  },
  card: {
    marginHorizontal: 18,
    marginTop: -28,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 22,
    shadowColor: "#064e3b",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 18,
  },
  modeSwitch: {
    flexDirection: "row",
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  modeBtnActive: {
    backgroundColor: "#065f46",
  },
  modeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065f46",
  },
  modeTextActive: {
    color: "#ffffff",
  },
  label: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  eyeBtn: { padding: 4 },
  serverToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  serverToggleText: { fontSize: 13, color: "#0f766e", fontWeight: "600" },
  serverBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  serverInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  helperText: { fontSize: 12, color: "#64748b" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { flex: 1, color: "#b91c1c", fontSize: 13 },
  buttonWrap: { marginTop: 6, borderRadius: 12, overflow: "hidden" },
  buttonDisabled: { opacity: 0.7 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  buttonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  bioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#065f46",
    backgroundColor: "#ecfdf5",
  },
  bioButtonText: { color: "#065f46", fontSize: 14, fontWeight: "700" },
});
