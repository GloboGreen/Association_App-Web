// app/Account.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function Account() {
  const router = useRouter();
  const { user, token, loading, setAuth, refreshUser } = useAuth();

  useRefreshUserOnFocus();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [additionalNumber, setAdditionalNumber] = useState("");
  const [saving, setSaving] = useState(false);

  // Redirect if not logged-in
  useEffect(() => {
    if (!loading && (!user || !token)) {
      router.replace("/Login");
    }
  }, [loading, user, token, router]);

  // Fill initial values when user loads/changes
  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setMobile(user.mobile || "");
    setAdditionalNumber(user.additionalNumber || "");
  }, [user?._id]);

  // 🔒 HARD LOCK (admin verified)
  const profileLocked = !!user?.isProfileVerified;

  const role = (user?.role as "OWNER" | "EMPLOYEE" | "USER") || "USER";
  const profilePercent = user?.profilePercent ?? 0;
  const isVerified = !!user?.isProfileVerified;
  const qrCodeUrl = (user as any)?.qrCodeUrl;
  const shopCompleted = !!(user as any)?.shopCompleted;

  const initialEmail = user?.email || "";

  const firstLetter = useMemo(() => {
    const base = (name || user?.name || "M").trim();
    return (base.charAt(0) || "M").toUpperCase();
  }, [name, user?.name]);

  // ✅ avatar from API only (supports /uploads/... or full http)
  const effectiveAvatarUri = useMemo(() => {
    const avatar = user?.avatar || "";
    if (!avatar) return "";
    if (avatar.startsWith("http")) return avatar;
    return `${baseURL}${avatar}`;
  }, [user?.avatar]);

  const onSave = async () => {
    if (profileLocked) {
      Alert.alert(
        "Profile locked",
        "Your profile is verified by admin. Editing is disabled."
      );
      return;
    }

    if (!token) {
      Alert.alert("Not logged in", "Please login again.");
      router.replace("/Login");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }

    const cleanMobile = (mobile || "").replace(/\D/g, "");
    if (cleanMobile && cleanMobile.length !== 10) {
      Alert.alert("Invalid mobile", "Please enter a valid 10-digit mobile.");
      return;
    }

    try {
      setSaving(true);

      // ✅ only text fields
      const form = new FormData();
      form.append("name", name.trim());
      form.append("mobile", cleanMobile);
      form.append("additionalNumber", additionalNumber || "");

      const res = await fetch(
        `${baseURL}${SummaryApi.user_update_profile.url}`,
        {
          method: SummaryApi.user_update_profile.method,
          body: form,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to update profile");
        return;
      }

      const updatedUser = data.user || data.data;
      if (updatedUser) {
        await setAuth(updatedUser, token);
        await refreshUser();
      }

      Alert.alert("Success", "Profile updated", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.log("Update error:", err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Loading guards ----------
  if (loading) {
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

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-5 bg-white rounded-b-3xl shadow-md shadow-slate-900/20">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-blue-600/90"
              >
                <Ionicons name="chevron-back" size={20} color="#EEF2FF" />
              </TouchableOpacity>
              <View>
                <Text className="text-sm font-semibold text-slate-900">
                  Account details
                </Text>
                <Text className="text-[11px] text-slate-500">
                  Personal and contact information
                </Text>
              </View>
            </View>

            <View className="rounded-full bg-blue-50 px-3 py-[4px]">
              <Text className="text-[11px] font-semibold text-blue-700">
                Profile
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 90,
          }}
        >
          {/* Profile lock banner */}
          {profileLocked && (
            <View className="mb-4 flex-row items-center rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
              <View className="mr-3 rounded-full bg-emerald-100 p-2">
                <Ionicons name="lock-closed" size={18} color="#047857" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold text-emerald-900">
                  Profile verified
                </Text>
                <Text className="mt-1 text-[11px] text-emerald-700">
                  Your profile is verified by admin. Editing is locked.
                </Text>
              </View>
            </View>
          )}

          <View className="rounded-3xl border border-blue-100 bg-white px-4 py-5 shadow-[0px_4px_14px_rgba(37,99,235,0.25)]">
            <View className="items-center">
              <View className="p-[2px] rounded-full bg-blue-500/90">
                {effectiveAvatarUri ? (
                  <Image
                    source={{ uri: effectiveAvatarUri }}
                    className="h-24 w-24 rounded-full border-2 border-white"
                  />
                ) : (
                  <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-600">
                    <Text className="text-4xl font-bold text-white">
                      {firstLetter}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                className="mt-3 text-base font-semibold text-slate-900"
                numberOfLines={1}
              >
                {name || "Your name"}
              </Text>

              <Text
                className="mt-1 text-[11px] text-slate-500"
                numberOfLines={1}
              >
                {initialEmail || "you@example.com"}
              </Text>
            </View>

            <View className="mt-6 space-y-4">
              {/* Full name */}
              <View>
                <Text className="mb-1 text-[11px] font-medium text-slate-600">
                  Full name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  editable={!profileLocked}
                  placeholder="Full name"
                  placeholderTextColor="#9ca3af"
                  className={`h-11 rounded-xl border px-3 text-sm ${
                    profileLocked
                      ? "bg-slate-100 border-slate-200 text-slate-400"
                      : "bg-white border-blue-200 text-slate-900"
                  }`}
                />
              </View>

              {/* Email (readonly) */}
              <View>
                <Text className="mb-1 text-[11px] font-medium text-slate-600">
                  Email
                </Text>
                <View className="h-11 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <Ionicons name="mail-outline" size={16} color="#6b7280" />
                  <Text
                    className="ml-2 flex-1 text-[12px] text-slate-600"
                    numberOfLines={1}
                  >
                    {initialEmail || "Not provided"}
                  </Text>
                </View>
              </View>

              {/* Mobile */}
              <View>
                <Text className="mb-1 text-[11px] font-medium text-slate-600">
                  Mobile number
                </Text>
                <View
                  className={`h-11 flex-row items-center rounded-xl border px-3 ${
                    profileLocked
                      ? "border-slate-200 bg-slate-100"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <Ionicons name="call-outline" size={16} color="#6b7280" />
                  <TextInput
                    value={mobile}
                    onChangeText={setMobile}
                    editable={!profileLocked}
                    placeholder="Enter mobile number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    maxLength={10}
                    className={`ml-2 flex-1 text-[12px] ${
                      profileLocked ? "text-slate-400" : "text-slate-700"
                    }`}
                  />
                </View>
              </View>

              {/* Additional number */}
              <View>
                <Text className="mb-1 text-[11px] font-medium text-slate-600">
                  Additional number
                </Text>
                <View
                  className={`h-11 flex-row items-center rounded-xl border px-3 ${
                    profileLocked
                      ? "border-slate-200 bg-slate-100"
                      : "border-blue-200 bg-white"
                  }`}
                >
                  <Ionicons name="call-outline" size={17} color="#6b7280" />
                  <TextInput
                    value={additionalNumber}
                    onChangeText={setAdditionalNumber}
                    editable={!profileLocked}
                    keyboardType="phone-pad"
                    placeholder="Enter additional number"
                    placeholderTextColor="#9ca3af"
                    className={`ml-2 flex-1 text-sm ${
                      profileLocked ? "text-slate-400" : "text-slate-900"
                    }`}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Save button */}
          <View className="mt-8">
            <TouchableOpacity
              disabled={profileLocked || saving}
              onPress={profileLocked ? undefined : onSave}
              className={`h-12 w-full items-center justify-center rounded-full shadow-lg ${
                profileLocked
                  ? "bg-slate-400"
                  : saving
                  ? "bg-blue-400/70 shadow-blue-300/50"
                  : "bg-blue-600 shadow-blue-300/70"
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#E0F2FE" />
              ) : (
                <Text className="text-sm font-semibold text-white">
                  {profileLocked ? "Profile locked" : "Save changes"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <AppBottomNav
          active="profile"
          role={role}
          id={user._id}
          name={user.name}
          email={user.email}
          image={user.avatar}
          qrCodeUrl={qrCodeUrl}
          profilePercent={profilePercent}
          isVerified={isVerified}
          shopCompleted={shopCompleted}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
