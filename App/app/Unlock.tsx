// app/Unlock.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useAppLock,
  getStoredPin,
  getStoredPattern,
  type LockType,
} from "./context/AppLockContext";

const DOTS = Array.from({ length: 9 }, (_, i) => i);

export default function Unlock() {
  const { lockType, markUnlocked, tryBiometricAuth } = useAppLock();
  const [mode, setMode] = useState<LockType>(lockType);
  const [ready, setReady] = useState(false);

  const [pinInput, setPinInput] = useState("");
  const [storedPin, setStoredPin] = useState("");
  const [patternInput, setPatternInput] = useState<number[]>([]);
  const [storedPattern, setStoredPattern] = useState("");

  useEffect(() => {
    const load = async () => {
      const [sp, st] = await Promise.all([getStoredPin(), getStoredPattern()]);
      setStoredPin(sp);
      setStoredPattern(st);
      setReady(true);
    };
    load();
  }, []);

  useEffect(() => {
    setMode(lockType);
  }, [lockType]);

  useEffect(() => {
    const auto = async () => {
      if (lockType === "BIOMETRIC") {
        const ok = await tryBiometricAuth();
        if (ok) markUnlocked();
      }
    };
    auto();
  }, [lockType]);

  const handlePinUnlock = () => {
    if (pinInput === storedPin && pinInput.length > 0) {
      markUnlocked();
    } else {
      Alert.alert("Wrong PIN", "Please try again.");
      setPinInput("");
    }
  };

  const onPatternDotPress = (idx: number) => {
    if (!patternInput.includes(idx)) {
      setPatternInput((prev) => [...prev, idx]);
    }
  };

  const clearPattern = () => setPatternInput([]);

  const handlePatternUnlock = () => {
    const current = patternInput.join("-");
    if (current === storedPattern && current.length > 0) {
      markUnlocked();
    } else {
      Alert.alert("Pattern incorrect", "Try again.");
      setPatternInput([]);
    }
  };

  if (!ready) return null;

  return (
    <SafeAreaView className="flex-1 bg-slate-100 items-center justify-center px-6">
      <View className="items-center mb-6">
        <Ionicons name="lock-closed" size={40} color="#0f172a" />
        <Text className="mt-2 text-xl font-bold text-slate-900">
          TNMA Locked
        </Text>
      </View>

      {mode === "PIN" && (
        <>
          <Text className="text-center text-lg font-semibold text-slate-900 mb-6">
            Enter PIN to unlock
          </Text>
          <TextInput
            value={pinInput}
            onChangeText={(t) => setPinInput(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            className="h-12 px-4 rounded-2xl bg-white border border-slate-300 text-center text-xl tracking-[8px]"
          />
          <TouchableOpacity
            onPress={handlePinUnlock}
            className="mt-6 h-12 rounded-full bg-blue-600 items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">Unlock</Text>
          </TouchableOpacity>
        </>
      )}

      {mode === "PATTERN" && (
        <>
          <Text className="text-center text-lg font-semibold text-slate-900 mb-6">
            Draw pattern to unlock
          </Text>

          <View className="w-56 h-56">
            <View className="flex-1 flex-row flex-wrap">
              {DOTS.map((idx) => {
                const pressed = patternInput.includes(idx);
                return (
                  <View
                    key={idx}
                    className="w-1/3 h-1/3 items-center justify-center"
                  >
                    <TouchableOpacity
                      onPress={() => onPatternDotPress(idx)}
                      className={`w-12 h-12 rounded-full border-2 ${
                        pressed
                          ? "bg-blue-600 border-blue-600"
                          : "border-slate-400"
                      }`}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          <View className="flex-row mt-8 space-x-4">
            <TouchableOpacity
              onPress={clearPattern}
              className="px-4 py-2 rounded-full border border-slate-400"
            >
              <Text className="text-slate-700">Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePatternUnlock}
              className="px-6 py-2 rounded-full bg-blue-600"
            >
              <Text className="text-white font-semibold">Unlock</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {mode === "BIOMETRIC" && (
        <>
          <Text className="text-center text-lg font-semibold text-slate-900 mb-6">
            Use fingerprint / face to unlock
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const ok = await tryBiometricAuth();
              if (ok) markUnlocked();
            }}
            className="h-12 px-6 rounded-full bg-blue-600 flex-row items-center justify-center"
          >
            <Ionicons name="finger-print" size={22} color="#fff" />
            <Text className="text-white font-semibold text-base ml-2">
              Unlock
            </Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}
