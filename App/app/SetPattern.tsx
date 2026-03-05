// app/SetPattern.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppLock } from "./context/AppLockContext";

const DOTS = Array.from({ length: 9 }, (_, i) => i);

export default function SetPattern() {
  const router = useRouter();
  const { setLockConfig } = useAppLock();

  const [stage, setStage] = useState<"FIRST" | "CONFIRM">("FIRST");
  const [pattern1, setPattern1] = useState<number[]>([]);
  const [current, setCurrent] = useState<number[]>([]);

  const onDotPress = (idx: number) => {
    if (!current.includes(idx)) {
      setCurrent((prev) => [...prev, idx]);
    }
  };

  const clearCurrent = () => setCurrent([]);

  const saveCurrent = async () => {
    if (current.length < 4) {
      Alert.alert("Pattern too short", "Connect at least 4 dots.");
      return;
    }

    if (stage === "FIRST") {
      setPattern1(current);
      setCurrent([]);
      setStage("CONFIRM");
      return;
    }

    if (pattern1.join("-") !== current.join("-")) {
      Alert.alert("Pattern mismatch", "Try again.");
      setPattern1([]);
      setCurrent([]);
      setStage("FIRST");
      return;
    }

    const finalPattern = current.join("-");
    await setLockConfig({
      enabled: true,
      type: "PATTERN",
      pin: null,
      pattern: finalPattern,
    });

    Alert.alert("App Lock", "Pattern lock enabled.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <View className="flex-row items-center p-4">
        <Ionicons
          name="chevron-back"
          size={22}
          color="#0f172a"
          onPress={() => router.back()}
        />
        <Text className="ml-2 text-lg font-semibold text-slate-800">
          Set Pattern
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-base text-slate-800 mb-6 text-center">
          {stage === "FIRST"
            ? "Draw an unlock pattern by tapping dots in order."
            : "Draw the same pattern again to confirm."}
        </Text>

        <View className="w-56 h-56">
          <View className="flex-1 flex-row flex-wrap">
            {DOTS.map((idx) => {
              const pressed = current.includes(idx);
              return (
                <View
                  key={idx}
                  className="w-1/3 h-1/3 items-center justify-center"
                >
                  <TouchableOpacity
                    onPress={() => onDotPress(idx)}
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
            onPress={clearCurrent}
            className="px-4 py-2 rounded-full border border-slate-400"
          >
            <Text className="text-slate-700">Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={saveCurrent}
            className="px-6 py-2 rounded-full bg-blue-600"
          >
            <Text className="text-white font-semibold">
              {stage === "FIRST" ? "Next" : "Save Pattern"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
