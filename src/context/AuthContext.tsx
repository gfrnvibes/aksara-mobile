import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  apiRequest,
  clearToken,
  getToken,
  setToken,
  TahunAjaranInfo,
  UserProfile,
} from '../lib/api';
import {
  registerForPushNotificationsAsync,
  syncJadwalLocalNotifications,
  unregisterPushNotificationsAsync,
} from '../lib/notifications';

interface AuthContextValue {
  user: UserProfile | null;
  tahunAjaran: TahunAjaranInfo | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaranInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setTahunAjaran(null);
      return;
    }

    try {
      const data = await apiRequest<{ user: UserProfile; tahun_ajaran: TahunAjaranInfo | null }>('/auth/me');
      setUser(data.user);
      setTahunAjaran(data.tahun_ajaran);
      registerForPushNotificationsAsync();
      syncJadwalLocalNotifications();
    } catch {
      await clearToken();
      setUser(null);
      setTahunAjaran(null);
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  const login = useCallback(async (identifier: string, password: string) => {
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

    await setToken(data.token);
    setUser(data.user);
    setTahunAjaran(data.tahun_ajaran);
    registerForPushNotificationsAsync();
    syncJadwalLocalNotifications();
  }, []);

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
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, tahunAjaran, loading, login, logout, refreshProfile }}>
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
