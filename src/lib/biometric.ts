import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { deleteStoredItem, getStoredItem, setStoredItem } from './storage';

const BIOMETRIC_ENABLED_KEY = 'aksara_biometric_lock';
const BIOMETRIC_CREDS_KEY = 'aksara_biometric_creds';

export type BiometricKind = 'face' | 'fingerprint';

export async function isBiometricSupported(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

export async function getBiometricKind(): Promise<BiometricKind> {
  if (Platform.OS === 'web') {
    return 'fingerprint';
  }

  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const hasFinger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    if (hasFace && !hasFinger) {
      return 'face';
    }
    return 'fingerprint';
  } catch {
    return 'fingerprint';
  }
}

export async function getBiometricEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  const value = await getStoredItem(BIOMETRIC_ENABLED_KEY);
  return value === '1';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await setStoredItem(BIOMETRIC_ENABLED_KEY, enabled ? '1' : '0');
}

export async function saveBiometricCredentials(
  identifier: string,
  password: string,
  role: 'guru' | 'siswa' = 'guru',
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  await setStoredItem(BIOMETRIC_CREDS_KEY, JSON.stringify({ identifier, password, role }));
}

export async function getBiometricCredentials(): Promise<{
  identifier: string;
  password: string;
  role: 'guru' | 'siswa';
} | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  const raw = await getStoredItem(BIOMETRIC_CREDS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      identifier?: string;
      password?: string;
      role?: 'guru' | 'siswa';
    };
    if (parsed.identifier && parsed.password) {
      return {
        identifier: parsed.identifier,
        password: parsed.password,
        role: parsed.role === 'siswa' ? 'siswa' : 'guru',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearBiometricCredentials(): Promise<void> {
  await deleteStoredItem(BIOMETRIC_CREDS_KEY);
}

export async function authenticateBiometric(promptMessage: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Gunakan PIN / Pola',
      cancelLabel: 'Batal',
    });
    return result.success;
  } catch {
    return false;
  }
}
