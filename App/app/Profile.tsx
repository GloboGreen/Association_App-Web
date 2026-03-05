// app/Profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth } from "./context/AuthContext";
import { useRequireAuth } from "./hooks/useRequireAuth";
import { useRefreshUserOnFocus } from "./hooks/useRefreshUserOnFocus";

type Role = "OWNER" | "EMPLOYEE" | "USER";

export default function Profile() {
  const router = useRouter();

  // ✅ refresh latest user (admin changes reflect)
  useRefreshUserOnFocus();

  const { user, loading } = useRequireAuth();
  const { token, clearAuth } = useAuth();

  if (loading) {
    return (
      <LinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="mt-3 text-sm text-white">Loading profile…</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!user) return null;

  const {
    _id,
    name = "Member",
    email = "",
    avatar,
    mobile,
    additionalNumber,
    role = "USER",
    RegistrationNumber,
    address,
    addressUpdatedAt,
    profilePercent,
    isProfileVerified,
    qrCodeUrl,
    shopCompleted,
  } = user as any;

  const effectiveRole: Role = ["OWNER", "EMPLOYEE", "USER"].includes(role)
    ? role
    : "USER";

  const shopName = (user as any)?.shopName;

  // ✅ avatar URL
  const avatarUri =
    avatar && typeof avatar === "string"
      ? avatar.startsWith("http")
        ? avatar
        : `${baseURL}${avatar}`
      : undefined;

  /**
   * 🔒 HARD LOCK RULE
   * - OWNER/USER: user.isProfileVerified
   * - EMPLOYEE: owner.isProfileVerified
   */
  const profileLocked =
    effectiveRole === "EMPLOYEE"
      ? !!(user as any)?.owner?.isProfileVerified
      : !!isProfileVerified;

  const verified = !!profileLocked;

  // --- KYC STATUS ---
  const kycStatusRaw =
    ((user as any).kycStatus as
      | "NOT_SUBMITTED"
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | undefined) || "NOT_SUBMITTED";

  const kycStatusInfo: Record<
    "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED",
    {
      label: string;
      badgeBg: string;
      badgeText: string;
      desc: string;
      button: string;
    }
  > = {
    NOT_SUBMITTED: {
      label: "Not submitted",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-700",
      desc: "Upload your Aadhaar, GST and Udyam documents to complete KYC verification.",
      button: "Upload KYC documents",
    },
    PENDING: {
      label: "Pending review",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-700",
      desc: "Your KYC documents are submitted and awaiting approval from the association admin.",
      button: "View / Update KYC",
    },
    APPROVED: {
      label: "KYC approved",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      desc: "Your KYC is verified. You can still view uploaded documents if needed.",
      button: "View KYC documents",
    },
    REJECTED: {
      label: "KYC rejected",
      badgeBg: "bg-rose-50",
      badgeText: "text-rose-700",
      desc: "Your KYC was rejected. Please re-submit clear documents as per guidelines.",
      button: "Re-submit KYC",
    },
  };

  const kycInfo = kycStatusInfo[kycStatusRaw];

  const formatAddress = () => {
    if (!address) return "No address added";
    return [
      address.street,
      address.area,
      address.city,
      address.district,
      address.state,
      address.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const lastUpdatedText = addressUpdatedAt
    ? new Date(addressUpdatedAt).toLocaleDateString()
    : null;

  // ✅ one central navigation blocker
  const blockIfLocked = (action: () => void) => {
    if (profileLocked) {
      Alert.alert(
        "Profile locked",
        "Your profile is verified by admin. Editing actions are disabled."
      );
      return;
    }
    action();
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            const t = token;

            // 1) Clear local auth immediately
            await clearAuth();

            // 2) Best-effort backend logout (do not block UI)
            if (t) {
              try {
                await fetch(`${baseURL}${SummaryApi.logout.url}`, {
                  method: SummaryApi.logout.method,
                  headers: { Authorization: `Bearer ${t}` },
                });
              } catch (e) {
                console.log("Logout API error:", e);
              }
            }

            // 3) Redirect
            router.replace("/Login"); 
          } catch (e) {
            console.log("Logout flow error:", e);
            // fallback
            router.replace("/Login");
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-5 bg-white rounded-b-3xl shadow-md">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            Profile
          </Text>

          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-xl font-bold text-gray-900">
              Account & Settings
            </Text>

            <View className="items-end">
              <View
                className={`flex-row items-center px-3 py-1 rounded-full ${
                  verified ? "bg-green-50" : "bg-yellow-50"
                }`}
              >
                <Ionicons
                  name={
                    verified
                      ? "shield-checkmark-outline"
                      : "alert-circle-outline"
                  }
                  size={14}
                  color={verified ? "#16a34a" : "#d97706"}
                />
                <Text
                  className={`ml-1 text-[11px] font-semibold ${
                    verified ? "text-green-700" : "text-yellow-700"
                  }`}
                >
                  {verified ? "Verified" : "Pending"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 96,
            paddingTop: 12,
          }}
        >
          {/* Lock banner */}
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
                  Your profile is verified by admin. Editing actions are locked.
                </Text>
              </View>
            </View>
          )}

          {/* Profile card */}
          <View className="mb-4 rounded-2xl overflow-hidden bg-white shadow-sm">
            <View className="flex-row items-center px-4 py-3">
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  className="w-14 h-14 rounded-full bg-blue-100"
                />
              ) : (
                <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center">
                  <Ionicons name="person-outline" size={28} color="#2563EB" />
                </View>
              )}

              <View className="ml-3 flex-1">
                <Text
                  className="text-base font-semibold text-gray-900"
                  numberOfLines={1}
                >
                  {name}
                </Text>

                {shopName && (
                  <Text
                    className="mt-1 text-xs text-gray-500"
                    numberOfLines={1}
                  >
                    {shopName}
                  </Text>
                )}

                {RegistrationNumber && (
                  <View className="mt-1 flex-row items-center">
                    <Ionicons
                      name="pricetag-outline"
                      size={12}
                      color="#6b7280"
                    />
                    <Text className="ml-1 text-[11px] text-gray-600">
                      Reg No:{" "}
                      <Text className="font-semibold text-gray-800">
                        {RegistrationNumber}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>

              <View className="ml-2 px-3 py-1 rounded-full bg-indigo-50">
                <Text className="text-[11px] font-semibold text-indigo-700">
                  {effectiveRole === "OWNER"
                    ? "OWNER"
                    : effectiveRole === "EMPLOYEE"
                    ? "EMPLOYEE"
                    : "MEMBER"}
                </Text>
              </View>
            </View>
          </View>

          {/* Contact card */}
          <View className="mb-4 rounded-2xl overflow-hidden shadow-sm">
            <View className="flex-row items-center justify-between bg-indigo-500 px-4 py-3">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-full bg-white/20 items-center justify-center mr-2">
                  <Ionicons name="call-outline" size={18} color="#ffffff" />
                </View>
                <View>
                  <Text className="text-xs font-semibold tracking-wide text-white">
                    CONTACT
                  </Text>
                  <Text className="text-[10px] text-indigo-100">
                    Reach you quickly for updates
                  </Text>
                </View>
              </View>

              <View className="px-3 py-1 rounded-full bg-white/20">
                <Text className="text-[10px] font-semibold text-white">
                  Primary : {mobile || "-"}
                </Text>
              </View>
            </View>

            <View className="bg-white px-4 py-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="w-8 h-8 rounded-full bg-sky-100 items-center justify-center mr-2">
                    <Ionicons name="call-outline" size={18} color="#0ea5e9" />
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">Mobile</Text>
                    <Text className="text-sm font-semibold text-slate-800">
                      {mobile || "-"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center flex-1">
                  <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center mr-2">
                    <Ionicons
                      name="logo-whatsapp"
                      size={18}
                      color="#16a34a"
                    />
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">WhatsApp</Text>
                    <Text className="text-sm font-semibold text-slate-800">
                      {mobile || "-"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="w-8 h-8 rounded-full bg-indigo-50 items-center justify-center mr-2">
                    <Ionicons name="call-outline" size={18} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">
                      Secondary Number
                    </Text>
                    <Text className="text-sm font-semibold text-slate-800">
                      {additionalNumber || "-"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center flex-1">
                  <View className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center mr-2">
                    <Ionicons name="mail-outline" size={18} color="#ef4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] text-slate-500">Email</Text>
                    <Text
                      className="text-xs font-semibold text-slate-800"
                      numberOfLines={1}
                    >
                      {email || "-"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Address */}
          <View className="mb-5 rounded-2xl overflow-hidden shadow-sm">
            <View className="flex-row items-center justify-between bg-indigo-500 px-4 py-3">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-full bg-white/20 items-center justify-center mr-2">
                  <Ionicons name="location-outline" size={16} color="#fff" />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-white tracking-wide">
                    SHOP ADDRESS
                  </Text>
                  <Text className="text-[10px] text-indigo-100">
                    Your registered business location
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                  blockIfLocked(() => router.push("/UpdateAddress"))
                }
                className={`flex-row items-center px-3 py-1 rounded-xl ${
                  profileLocked ? "bg-white/10" : "bg-white/20"
                }`}
              >
                <Ionicons
                  name="pencil-outline"
                  size={14}
                  color={profileLocked ? "#d1d5db" : "#ffffff"}
                />
                <Text
                  className={`ml-1 text-[12px] font-semibold ${
                    profileLocked ? "text-slate-300" : "text-white"
                  }`}
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white px-4 py-3">
              <Text className="text-xs text-gray-700 leading-5">
                {formatAddress()}
              </Text>
              {lastUpdatedText ? (
                <Text className="mt-2 text-[10px] text-slate-400">
                  Last updated: {lastUpdatedText}
                </Text>
              ) : null}
            </View>
          </View>

          {/* KYC card */}
          <View className="mb-5 rounded-2xl overflow-hidden shadow-sm">
            <View className="flex-row items-center justify-between bg-indigo-500 px-4 py-3">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-full bg-white/20 items-center justify-center mr-2">
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color="#ffffff"
                  />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-white tracking-wide">
                    KYC VERIFICATION
                  </Text>
                  <Text className="text-[10px] text-indigo-100">
                    Aadhaar, GST & Udyam documents
                  </Text>
                </View>
              </View>

              <View className={`px-3 py-1 rounded-full ${kycInfo.badgeBg}`}>
                <Text
                  className={`text-[10px] font-semibold ${kycInfo.badgeText}`}
                >
                  {kycInfo.label}
                </Text>
              </View>
            </View>

            <View className="bg-white px-4 py-3">
              <Text className="text-xs text-slate-700 leading-5">
                {kycInfo.desc}
              </Text>

              <TouchableOpacity
                onPress={() => blockIfLocked(() => router.push("/UploadKyc"))}
                activeOpacity={0.9}
                className={`mt-4 h-11 flex-row items-center justify-center rounded-full ${
                  profileLocked ? "bg-slate-400" : "bg-blue-600"
                }`}
              >
                <Ionicons name="cloud-upload-outline" size={16} color="#DBEAFE" />
                <Text className="ml-2 text-xs font-semibold text-blue-50">
                  {profileLocked ? "KYC Locked" : kycInfo.button}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick actions */}
          <View className="mb-6 rounded-2xl overflow-hidden shadow-sm">
            <View className="bg-indigo-500 px-4 py-3 flex-row items-center">
              <View className="w-7 h-7 rounded-full bg-white/20 items-center justify-center mr-2">
                <Ionicons name="grid-outline" size={16} color="#fff" />
              </View>
              <View>
                <Text className="text-xs font-semibold text-white tracking-wide">
                  QUICK ACTIONS
                </Text>
                <Text className="text-[10px] text-indigo-100">
                  Manage your account instantly
                </Text>
              </View>
            </View>

            <View className="bg-white p-4">
              <View className="flex-row flex-wrap justify-between">
                <ActionTile
                  icon="person-circle-outline"
                  title="Edit Profile"
                  disabled={profileLocked}
                  onPress={() => blockIfLocked(() => router.push("/Account"))}
                />

                <ActionTile
                  icon="location-outline"
                  title="Update Address"
                  disabled={profileLocked}
                  onPress={() =>
                    blockIfLocked(() => router.push("/UpdateAddress"))
                  }
                />

                <ActionTile
                  icon="key-outline"
                  title="Change Password"
                  disabled={false}
                  onPress={() => router.push("/Seller")}
                />

                <ActionTile
                  icon="chatbubbles-outline"
                  title="Contact Us"
                  disabled={false}
                  onPress={() => router.push("/ContactUs")}
                />

                <ActionTile
                  icon="help-circle-outline"
                  title="FAQs"
                  disabled={false}
                  onPress={() => router.push("/Faqs")}
                />
              </View>

              <TouchableOpacity
                className="mt-4 flex-row items-center justify-between bg-red-500 rounded-2xl px-4 py-3 shadow-[0_4px_10px_rgba(220,38,38,0.4)]"
                onPress={handleLogout}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-full bg-red-100 items-center justify-center mr-3">
                    <Ionicons name="log-out-outline" size={20} color="#b91c1c" />
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-white">
                      Logout
                    </Text>
                    <Text className="text-[11px] text-red-100">
                      Sign out from device
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#fee2e2" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <AppBottomNav
          active="profile"
          role={effectiveRole}
          id={_id}
          name={name}
          email={email}
          image={avatarUri}
          qrCodeUrl={qrCodeUrl}
          profilePercent={profilePercent ?? 0}
          isVerified={verified}
          shopCompleted={shopCompleted}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

function ActionTile({
  icon,
  title,
  onPress,
  disabled,
}: {
  icon: any;
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.9}
      className={`w-[48%] mb-4 items-center justify-center rounded-2xl py-4 shadow-[0_2px_6px_rgba(0,0,0,0.08)] ${
        disabled ? "bg-slate-200" : "bg-slate-50"
      }`}
    >
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
          disabled ? "bg-slate-300" : "bg-indigo-100"
        }`}
      >
        <Ionicons
          name={icon}
          size={20}
          color={disabled ? "#6b7280" : "#4f46e5"}
        />
      </View>
      <Text
        className={`text-[13px] font-semibold text-center ${
          disabled ? "text-slate-500" : "text-gray-900"
        }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
