// app/SecuritySettings.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
  useAppLock,
  type LockType,
} from "./context/AppLockContext";

export default function SecuritySettings() {
  const router = useRouter();
  const { lockEnabled, lockType, setLockConfig, tryBiometricAuth } =
    useAppLock();

  const [enabled, setEnabled] = useState(lockEnabled);
  const [selectedType, setSelectedType] = useState<LockType>(
    lockType || "PIN"
  );
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    setEnabled(lockEnabled);
    setSelectedType(lockType || "PIN");
  }, [lockEnabled, lockType]);

  const onToggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      setLockConfig({ enabled: false, type: null, pin: null, pattern: null });
    }
  };

  const handleSave = async () => {
    if (!enabled) {
      await setLockConfig({
        enabled: false,
        type: null,
        pin: null,
        pattern: null,
      });
      Alert.alert("App Lock", "App lock disabled.");
      return;
    }

    if (selectedType === "PIN") {
      if (pin.length < 4 || pin.length > 6) {
        Alert.alert("PIN Error", "PIN must be 4–6 digits.");
        return;
      }
      if (pin !== confirmPin) {
        Alert.alert("PIN Error", "PIN and Confirm PIN do not match.");
        return;
      }

      await setLockConfig({
        enabled: true,
        type: "PIN",
        pin,
        pattern: null,
      });
      Alert.alert("App Lock", "PIN lock enabled.");
      return;
    }

    if (selectedType === "PATTERN") {
      router.push("/SetPattern");
      return;
    }

    if (selectedType === "BIOMETRIC") {
      const ok = await tryBiometricAuth();
      if (!ok) {
        Alert.alert(
          "Biometric not available",
          "Fingerprint / face lock is not configured on this phone."
        );
        return;
      }
      await setLockConfig({
        enabled: true,
        type: "BIOMETRIC",
        pin: null,
        pattern: null,
      });
      Alert.alert("App Lock", "Biometric unlock enabled.");
    }
  };

  const TypeButton = ({
    value,
    label,
    icon,
  }: {
    value: LockType;
    label: string;
    icon: any;
  }) => (
    <TouchableOpacity
      onPress={() => setSelectedType(value)}
      className={`flex-row items-center px-4 py-3 rounded-2xl border mb-3 ${
        selectedType === value ? "border-blue-600 bg-blue-50" : "border-slate-300"
      }`}
    >
      <Ionicons
        name={icon}
        size={20}
        color={selectedType === value ? "#2563EB" : "#64748B"}
      />
      <Text
        className={`ml-3 text-base ${
          selectedType === value ? "text-blue-700 font-semibold" : "text-slate-700"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      {/* Header */}
      <View className="flex-row items-center p-4">
        <Ionicons
          name="chevron-back"
          size={22}
          color="#0f172a"
          onPress={() => router.back()}
        />
        <Text className="ml-2 text-lg font-semibold text-slate-800">
          Security & App Lock
        </Text>
      </View>

      {/* Body */}
      <View className="px-4">
        <Text className="text-slate-500 text-xs">
          Protect your TNMA account and QR transactions with App Lock.
        </Text>

        <View className="mt-5 bg-white rounded-2xl p-4 shadow">
          {/* Toggle */}
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-base font-medium text-slate-800">
                App Lock
              </Text>
              <Text className="text-xs text-slate-500">
                Ask for PIN / Pattern / Biometric when opening TNMA.
              </Text>
            </View>
            <Switch value={enabled} onValueChange={onToggleEnabled} />
          </View>

          {enabled && (
            <>
              <Text className="text-[11px] text-slate-400 mb-2">
                Choose unlock method:
              </Text>

              <TypeButton value="PIN" label="PIN (4–6 digits)" icon="keypad" />
              <TypeButton value="PATTERN" label="Pattern lock" icon="grid" />
              <TypeButton
                value="BIOMETRIC"
                label="Fingerprint / Face unlock"
                icon="finger-print"
              />

              {selectedType === "PIN" && (
                <View className="mt-4">
                  <Text className="text-xs text-slate-500 mb-1">Enter PIN</Text>
                  <TextInput
                    value={pin}
                    onChangeText={(t) => setPin(t.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    className="h-11 px-4 rounded-2xl bg-slate-50 border border-slate-300 text-base"
                  />

                  <Text className="text-xs text-slate-500 mt-3 mb-1">
                    Confirm PIN
                  </Text>
                  <TextInput
                    value={confirmPin}
                    onChangeText={(t) =>
                      setConfirmPin(t.replace(/[^0-9]/g, ""))
                    }
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    className="h-11 px-4 rounded-2xl bg-slate-50 border border-slate-300 text-base"
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={handleSave}
                className="mt-6 h-11 rounded-full bg-blue-600 items-center justify-center"
              >
                <Text className="text-white font-semibold text-sm">Save</Text>
              </TouchableOpacity>

              <Text className="text-[11px] text-slate-400 mt-3">
                TNMA never sees or stores your phone PIN or fingerprint data.
              </Text>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
