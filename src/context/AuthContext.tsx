import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  apiRequest,
  clearToken,
  getToken,
  setToken,
  TahunAjaranInfo,
  UserProfile,
} from '../lib/api';
import {
  authenticateBiometric,
  BiometricKind,
  clearBiometricCredentials,
  getBiometricCredentials,
  getBiometricEnabled,
  getBiometricKind,
  isBiometricSupported,
  saveBiometricCredentials,
  setBiometricEnabled as saveBiometricEnabled,
} from '../lib/biometric';
import {
  registerForPushNotificationsAsync,
  syncJadwalLocalNotifications,
  unregisterPushNotificationsAsync,
} from '../lib/notifications';

interface AuthContextValue {
  user: UserProfile | null;
  tahunAjaran: TahunAjaranInfo | null;
  loading: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricLocked: boolean;
  biometricKind: BiometricKind;
  hasBiometricCredentials: boolean;
  toggleBiometric: (enabled: boolean) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  loginWithBiometric: () => Promise<void>;
  updateSavedBiometricPassword: (newPassword: string) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  loginSiswa: (nis: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaranInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLocked, setBiometricLocked] = useState(false);
  const [biometricKind, setBiometricKind] = useState<BiometricKind>('fingerprint');
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);
  const lastCredsRef = useRef<{
    identifier: string;
    password: string;
    role: 'guru' | 'siswa';
  } | null>(null);
  const appState = useRef<string>(AppState.currentState ?? 'active');
  const unlockingRef = useRef(false);

  const refreshProfile = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setTahunAjaran(null);
      setBiometricLocked(false);
      return;
    }

    try {
      const data = await apiRequest<{ user: UserProfile; tahun_ajaran: TahunAjaranInfo | null }>('/auth/me');
      setUser(data.user);
      setTahunAjaran(data.tahun_ajaran);
      if (data.user.role === 'guru') {
        registerForPushNotificationsAsync();
        syncJadwalLocalNotifications();
      }
    } catch {
      await clearToken();
      setUser(null);
      setTahunAjaran(null);
      setBiometricLocked(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      isBiometricSupported(),
      getBiometricEnabled(),
      getBiometricKind(),
      getBiometricCredentials(),
    ])
      .then(async ([supported, enabled, kind, savedCreds]) => {
        setBiometricAvailable(supported);
        setBiometricKind(kind);
        const active = supported && enabled;
        setBiometricEnabled(active);
        setHasBiometricCredentials(Boolean(savedCreds));
        const token = await getToken();
        if (active && token) {
          setBiometricLocked(true);
        }
      })
      .then(() => refreshProfile())
      .finally(() => setLoading(false));
  }, [refreshProfile]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current === 'background' &&
        nextState === 'active' &&
        user !== null &&
        biometricEnabled &&
        !unlockingRef.current
      ) {
        setBiometricLocked(true);
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [user, biometricEnabled]);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    if (unlockingRef.current) return false;
    unlockingRef.current = true;
    try {
      const ok = await authenticateBiometric('Buka kunci aplikasi Aksara Guru');
      if (ok) {
        setBiometricLocked(false);
      }
      return ok;
    } finally {
      setTimeout(() => {
        unlockingRef.current = false;
      }, 400);
    }
  }, []);

  const toggleBiometric = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      if (!biometricAvailable) {
        return false;
      }

      if (enabled) {
        unlockingRef.current = true;
        try {
          const ok = await authenticateBiometric('Konfirmasi biometrik untuk mengaktifkan kunci');
          if (!ok) return false;
        } finally {
          setTimeout(() => {
            unlockingRef.current = false;
          }, 400);
        }
        if (lastCredsRef.current) {
          await saveBiometricCredentials(
            lastCredsRef.current.identifier,
            lastCredsRef.current.password,
            lastCredsRef.current.role,
          );
          setHasBiometricCredentials(true);
        }
      } else {
        await clearBiometricCredentials();
        setHasBiometricCredentials(false);
      }

      await saveBiometricEnabled(enabled);
      setBiometricEnabled(enabled);
      return true;
    },
    [biometricAvailable],
  );

  const login = useCallback(
    async (identifier: string, password: string) => {
      const data = await apiRequest<{
        token: string;
        user: UserProfile;
        tahun_ajaran: TahunAjaranInfo | null;
      }>('/auth/login', {
        method: 'POST',
        auth: false,
        body: {
          login: identifier,
          password,
          device_name: 'aksara-mobile',
        },
      });

      lastCredsRef.current = { identifier, password, role: 'guru' };
      if (biometricEnabled) {
        await saveBiometricCredentials(identifier, password, 'guru');
        setHasBiometricCredentials(true);
      }

      await setToken(data.token);
      setUser(data.user);
      setTahunAjaran(data.tahun_ajaran);
      setBiometricLocked(false);
      registerForPushNotificationsAsync();
      if (data.user.role === 'guru') {
        syncJadwalLocalNotifications();
      }
    },
    [biometricEnabled],
  );

  const loginSiswa = useCallback(
    async (nis: string, password: string) => {
      const data = await apiRequest<{
        token: string;
        user: UserProfile;
        tahun_ajaran: TahunAjaranInfo | null;
      }>('/auth/login-siswa', {
        method: 'POST',
        auth: false,
        body: {
          nis,
          password,
          device_name: 'aksara-mobile-siswa',
        },
      });

      lastCredsRef.current = { identifier: nis, password, role: 'siswa' };
      if (biometricEnabled) {
        await saveBiometricCredentials(nis, password, 'siswa');
        setHasBiometricCredentials(true);
      }

      await setToken(data.token);
      setUser(data.user);
      setTahunAjaran(data.tahun_ajaran);
      setBiometricLocked(false);
      registerForPushNotificationsAsync();
    },
    [biometricEnabled],
  );

  const loginWithBiometric = useCallback(async () => {
    const creds = await getBiometricCredentials();
    if (!creds) {
      throw new Error('Login manual satu kali terlebih dahulu untuk menyimpan sesi biometrik.');
    }
    const ok = await authenticateBiometric('Masuk ke Aksara dengan biometrik');
    if (!ok) {
      return;
    }
    if (creds.role === 'siswa') {
      await loginSiswa(creds.identifier, creds.password);
    } else {
      await login(creds.identifier, creds.password);
    }
  }, [login, loginSiswa]);

  const updateSavedBiometricPassword = useCallback(
    async (newPassword: string) => {
      if (!biometricEnabled) return;
      const saved = await getBiometricCredentials();
      const identifier = saved?.identifier ?? lastCredsRef.current?.identifier;
      const role = saved?.role ?? lastCredsRef.current?.role ?? 'guru';
      if (identifier) {
        lastCredsRef.current = { identifier, password: newPassword, role };
        await saveBiometricCredentials(identifier, newPassword, role);
        setHasBiometricCredentials(true);
      }
    },
    [biometricEnabled],
  );

  const logout = useCallback(async () => {
    await unregisterPushNotificationsAsync();
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors when clearing local session.
    } finally {
      await clearToken();
      setUser(null);
      setTahunAjaran(null);
      setBiometricLocked(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        tahunAjaran,
        loading,
        biometricAvailable,
        biometricEnabled,
        biometricLocked,
        biometricKind,
        hasBiometricCredentials,
        toggleBiometric,
        unlockWithBiometric,
        loginWithBiometric,
        updateSavedBiometricPassword,
        login,
        loginSiswa,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }
  return ctx;
}
