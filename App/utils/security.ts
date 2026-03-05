// utils/security.ts
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SECURITY_KEY = "tnma_security_enabled";

/** Save ON/OFF from Settings screen */
export async function setSecurityEnabled(value: boolean) {
  await AsyncStorage.setItem(SECURITY_KEY, value.toString());
}

/** Read ON/OFF value */
export async function isSecurityEnabled() {
  const saved = await AsyncStorage.getItem(SECURITY_KEY);
  return saved === "true";
}

/** What biometric methods are supported? */
export async function getSupportedMethods(): Promise<string[]> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) return [];

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  return types.map((t) => {
    if (t === LocalAuthentication.AuthenticationType.FINGERPRINT)
      return "Fingerprint";
    if (t === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      return "Face Unlock";
    if (t === LocalAuthentication.AuthenticationType.IRIS) return "Iris";
    return "Unknown";
  });
}

/** Ask device to unlock (Fingerprint / Face / PIN / Pattern / Password) */
export async function askDeviceUnlock(promptMessage = "Unlock to continue") {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Cancel",
    fallbackLabel: "Use PIN / Password",
  });

  return result.success;
}

/**
 * High level:
 *  - if security disabled → allow
 *  - if enabled → show biometric / PIN screen
 */
export async function ensureSecureAccess(promptMessage?: string) {
  const enabled = await isSecurityEnabled();
  if (!enabled) return true;

  return askDeviceUnlock(promptMessage || "Unlock to continue");
}
