// app/UpdatePassword.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SummaryApi, { baseURL } from "../constants/SummaryApi";

export default function UpdatePassword() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!currentPassword || !newPassword || !confirm) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert("Error", "New password and confirm password do not match.");
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "Not logged in");
        router.replace("/Login");
        return;
      }

      const res = await fetch(
        `${baseURL}${SummaryApi.change_password.url}`,
        {
          method: SummaryApi.change_password.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to change password");
        return;
      }

      Alert.alert("Success", "Password changed successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    placeholder?: string
  ) => (
    <View className="mb-4">
      <Text className="mb-1 text-[11px] font-medium text-slate-600">
        {label}
      </Text>
      <View className="flex-row items-center h-11 rounded-xl border border-emerald-200 bg-white px-3">
        <Ionicons name="lock-closed-outline" size={16} color="#6b7280" />
        <TextInput
          value={value}
          onChangeText={setValue}
          secureTextEntry
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          className="ml-2 flex-1 text-sm text-slate-900"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
      {/* Header – green bar */}
      <View className="rounded-b-3xl bg-emerald-600 px-5 pt-4 pb-5 shadow-md shadow-emerald-900/40">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-emerald-700/80"
            >
              <Ionicons name="chevron-back" size={20} color="#ecfdf5" />
            </TouchableOpacity>
            <View>
              <Text className="text-sm font-semibold text-white">
                Update password
              </Text>
              <Text className="text-[11px] text-emerald-100">
                Keep your member account secure
              </Text>
            </View>
          </View>

          <View className="rounded-full bg-emerald-500/30 px-3 py-[4px]">
            <Text className="text-[11px] font-semibold text-emerald-50">
              Security
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 40,
        }}
      >
        {/* Card */}
        <View className="-mt-4 rounded-3xl border border-emerald-100 bg-white px-4 py-5 shadow-[0px_2px_10px_rgba(16,185,129,0.18)]">
          <View className="mb-4 flex-row items-center">
            <View className="mr-3 rounded-full bg-emerald-50 p-2">
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color="#16a34a"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-900">
                Change your password
              </Text>
              <Text className="mt-1 text-[11px] text-slate-500">
                Use a strong password that you don&apos;t use anywhere else.
              </Text>
            </View>
          </View>

          {renderPasswordInput(
            "Current password",
            currentPassword,
            setCurrentPassword,
            "Enter current password"
          )}
          {renderPasswordInput(
            "New password",
            newPassword,
            setNewPassword,
            "Enter new password"
          )}
          {renderPasswordInput(
            "Confirm new password",
            confirm,
            setConfirm,
            "Re-enter new password"
          )}

          <View className="mt-2">
            <Text className="text-[10px] text-slate-500">
              Tip: Use at least 8 characters, including numbers and symbols.
            </Text>
          </View>
        </View>

        {/* Save button */}
        <View className="mt-8">
          <TouchableOpacity
            disabled={saving}
            onPress={onSave}
            className={`h-12 w-full items-center justify-center rounded-full shadow-lg shadow-emerald-300/70 ${
              saving ? "bg-emerald-400/70" : "bg-emerald-500"
            }`}
          >
            {saving ? (
              <ActivityIndicator color="#022c22" />
            ) : (
              <Text className="text-sm font-semibold text-emerald-50">
                Save password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
