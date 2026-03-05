import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth } from "./context/AuthContext";
import { useRefreshUserOnFocus } from "./hooks/useRefreshUserOnFocus";

type Role = "OWNER" | "EMPLOYEE" | "USER";

export default function ChangePassword() {
  const router = useRouter();
  const { user, token, refreshUser } = useAuth();

  // refresh user when screen focused
  useRefreshUserOnFocus();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);

  const mismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const canSubmit = useMemo(() => {
    if (!oldPassword.trim()) return false;
    if (newPassword.trim().length < 6) return false;
    if (confirmPassword.trim().length < 6) return false;
    if (newPassword !== confirmPassword) return false;
    if (saving) return false;
    return true;
  }, [oldPassword, newPassword, confirmPassword, saving]);

  const resetFields = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert("Login required", "Please login again.");
      router.replace("/Login");
      return;
    }

    if (!oldPassword.trim()) {
      Alert.alert("Missing", "Please enter old password.");
      return;
    }

    if (newPassword.trim().length < 6) {
      Alert.alert("Weak password", "New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New password and confirm password do not match.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${baseURL}${SummaryApi.change_password.url}`, {
        method: SummaryApi.change_password.method, // POST ✅
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        Alert.alert("Failed", data?.message || "Could not change password.");
        return;
      }

      // optional: refresh user state
      try {
        await refreshUser();
      } catch {}

      Alert.alert("Success", "Password changed successfully.", [
        {
          text: "OK",
          onPress: () => {
            resetFields();
            router.back();
          },
        },
      ]);
    } catch (err: any) {
      console.log("Change password error:", err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // redirect UI (same style as your other screens)
  if (!user || !token) {
    return (
      <LinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator color="#ffffff" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const role = ((user as any).role as Role) || "USER";
  const profilePercent = (user as any).profilePercent ?? 0;
  const isVerified = !!(user as any)?.isProfileVerified;
  const qrCodeUrl = (user as any)?.qrCodeUrl;
  const shopCompleted = !!(user as any)?.shopCompleted;

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="ml-3">
              <Text className="text-base font-semibold text-white">
                Change Password
              </Text>
              <Text className="text-[11px] text-white/80">
                Old password required
              </Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 260,
            }}
          >
            {/* Main Card */}
            <View className="rounded-3xl bg-white px-5 py-6 shadow-xl shadow-slate-900/10">
              {/* Top image + heading */}
              <View className="items-center">
                <Image
                  source={require("../assets/images/change-password.png")}
                  style={{ width: 160, height: 160 }}
                  resizeMode="contain"
                />
                <Text className="mt-2 text-lg font-bold text-slate-900">
                  Change Password
                </Text>
                <Text className="mt-1 text-center text-[11px] text-slate-500">
                  Enter your current password and set a new password.
                </Text>
              </View>

              {/* Old Password */}
              <View className="mt-6">
                <Text className="mb-2 text-[11px] font-semibold text-slate-700">
                  Old Password
                </Text>
                <View className="flex-row items-center rounded-2xl bg-slate-100 px-4">
                  <TextInput
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="Old password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showOld}
                    className="flex-1 py-3 text-[13px] text-slate-900"
                  />
                  <TouchableOpacity onPress={() => setShowOld((v) => !v)}>
                    <Ionicons
                      name={showOld ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View className="mt-4">
                <Text className="mb-2 text-[11px] font-semibold text-slate-700">
                  New Password
                </Text>
                <View className="flex-row items-center rounded-2xl bg-slate-100 px-4">
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="New password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNew}
                    className="flex-1 py-3 text-[13px] text-slate-900"
                  />
                  <TouchableOpacity onPress={() => setShowNew((v) => !v)}>
                    <Ionicons
                      name={showNew ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
                <Text className="mt-1 text-[10px] text-slate-500">
                  Minimum 6 characters.
                </Text>
              </View>

              {/* Confirm Password */}
              <View className="mt-4">
                <Text className="mb-2 text-[11px] font-semibold text-slate-700">
                  Confirm Password
                </Text>
                <View className="flex-row items-center rounded-2xl bg-slate-100 px-4">
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showConfirm}
                    className="flex-1 py-3 text-[13px] text-slate-900"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                {mismatch && (
                  <Text className="mt-2 text-[10px] font-semibold text-rose-600">
                    Passwords do not match.
                  </Text>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                disabled={!canSubmit}
                onPress={handleSubmit}
                className={`mt-6 h-12 w-full items-center justify-center rounded-full ${
                  canSubmit ? "bg-orange-500" : "bg-orange-300"
                }`}
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 4,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-sm font-semibold text-white">
                    CONFIRM CHANGE
                  </Text>
                )}
              </TouchableOpacity>

              {/* Info box */}
              <View className="mt-4 rounded-2xl bg-slate-50 px-3 py-3">
                <Text className="text-[10px] text-slate-600">
                  If your account was created using Google login, password change
                  is not allowed.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Nav */}
        <AppBottomNav
          active="profile"
          role={role}
          id={(user as any)._id}
          name={(user as any).name}
          email={(user as any).email}
          image={(user as any).avatar}
          qrCodeUrl={qrCodeUrl}
          profilePercent={profilePercent}
          isVerified={isVerified}
          shopCompleted={shopCompleted}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
