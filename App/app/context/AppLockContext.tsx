// app/context/AppLockContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";

const STORAGE_KEYS = {
  enabled: "TNMA_APP_LOCK_ENABLED",
  type: "TNMA_APP_LOCK_TYPE", // PIN | PATTERN | BIOMETRIC
  pin: "TNMA_APP_LOCK_PIN",
  pattern: "TNMA_APP_LOCK_PATTERN",
};

export type LockType = "PIN" | "PATTERN" | "BIOMETRIC" | null;

interface AppLockContextValue {
  lockEnabled: boolean;
  lockType: LockType;
  isUnlocked: boolean;
  loading: boolean;

  setLockConfig: (opts: {
    enabled: boolean;
    type: LockType;
    pin?: string | null;
    pattern?: string | null;
  }) => Promise<void>;

  markUnlocked: () => void;
  tryBiometricAuth: () => Promise<boolean>;
}

const AppLockContext = createContext<AppLockContextValue | undefined>(
  undefined
);

export const AppLockProvider = ({ children }: { children: React.ReactNode }) => {
  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockType, setLockType] = useState<LockType>(null);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load config once
  useEffect(() => {
    const load = async () => {
      try {
        const [enabledStr, typeStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.enabled),
          AsyncStorage.getItem(STORAGE_KEYS.type),
        ]);

        const enabled = enabledStr === "true";
        setLockEnabled(enabled);
        setLockType((typeStr as LockType) || null);
        setIsUnlocked(!enabled);
      } catch (e) {
        console.warn("AppLock load error", e);
        setLockEnabled(false);
        setIsUnlocked(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Relock when app comes to foreground
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === "active" && lockEnabled) {
        setIsUnlocked(false);
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [lockEnabled]);

  const setLockConfig: AppLockContextValue["setLockConfig"] = useCallback(
    async ({ enabled, type, pin, pattern }) => {
      setLoading(true);
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.enabled,
          enabled ? "true" : "false"
        );
        await AsyncStorage.setItem(STORAGE_KEYS.type, type || "");

        if (pin !== undefined) {
          if (pin) await AsyncStorage.setItem(STORAGE_KEYS.pin, pin);
          else await AsyncStorage.removeItem(STORAGE_KEYS.pin);
        }

        if (pattern !== undefined) {
          if (pattern)
            await AsyncStorage.setItem(STORAGE_KEYS.pattern, pattern);
          else await AsyncStorage.removeItem(STORAGE_KEYS.pattern);
        }

        setLockEnabled(enabled);
        setLockType(type);
        setIsUnlocked(!enabled);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markUnlocked = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const tryBiometricAuth = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock TNMA",
        fallbackLabel: "Use PIN / Pattern",
      });
      return !!result.success;
    } catch (err) {
      console.warn("Biometric error", err);
      return false;
    }
  }, []);

  const value: AppLockContextValue = {
    lockEnabled,
    lockType,
    isUnlocked,
    loading,
    setLockConfig,
    markUnlocked,
    tryBiometricAuth,
  };

  return (
    <AppLockContext.Provider value={value}>
      {children}
    </AppLockContext.Provider>
  );
};

export const useAppLock = () => {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error("useAppLock must be used inside AppLockProvider");
  return ctx;
};

export const getStoredPin = () =>
  AsyncStorage.getItem(STORAGE_KEYS.pin).then((v) => v || "");

export const getStoredPattern = () =>
  AsyncStorage.getItem(STORAGE_KEYS.pattern).then((v) => v || "");
