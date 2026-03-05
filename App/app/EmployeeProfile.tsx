// app/EmployeeProfile.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

type Role = "OWNER" | "EMPLOYEE" | "USER";

export default function EmployeeProfile() {
  const router = useRouter();

  // Require login
  const { user, loading } = useRequireAuth();
  const { token, clearAuth } = useAuth();

  /* ---------------------------------------------------------
   * LOADER
   ---------------------------------------------------------- */
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

  /* ---------------------------------------------------------
   * USER DATA
   ---------------------------------------------------------- */
  const {
    _id,
    name = "Member",
    email = "",
    avatar,
    mobile,
    role = "USER",
    address, // fallback
    shopAddress,
    profilePercent,
    qrCodeUrl,
    shopCompleted,
  } = user as any;

  const effectiveRole: Role = ["OWNER", "EMPLOYEE", "USER"].includes(role)
    ? role
    : "USER";

  // If non-employee lands here, send them to main Profile
  if (effectiveRole !== "EMPLOYEE") {
    router.replace("/Profile");
    return null;
  }

  const avatarUri =
    avatar && avatar.startsWith("http")
      ? avatar
      : avatar
      ? `${baseURL}${avatar}`
      : undefined;

  const shopName = (user as any)?.shopName;

  /* ---------------------------------------------------------
   * HELPERS
   ---------------------------------------------------------- */
  const formatAddress = () => {
    const addr = shopAddress || address;

    if (!addr) return "No address added";
    return [
      addr.street,
      addr.area,
      addr.city,
      addr.district,
      addr.state,
      addr.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            if (token) {
              try {
                await fetch(`${baseURL}${SummaryApi.logout.url}`, {
                  method: SummaryApi.logout.method,
                  headers: { Authorization: `Bearer ${token}` },
                  credentials: "include",
                });
              } catch (e) {
                console.log("Logout API error:", e);
              }
            }

            await clearAuth();
            router.replace("/Login");
          } catch (e) {
            console.log("Logout flow error:", e);
          }
        },
      },
    ]);
  };

  /* ---------------------------------------------------------
   * UI
   ---------------------------------------------------------- */
  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* ---------------- HEADER BAR ---------------- */}
        <View className="px-4 pt-4 pb-5 bg-white rounded-b-3xl shadow-md shadow-slate-900/5">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            Profile
          </Text>

          <View className="mt-1 flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-slate-900">
                Employee Account
              </Text>
              <Text className="mt-1 text-[11px] text-slate-500">
                View your work details and contact information
              </Text>
            </View>

            {/* small badge on header */}
            <View className="rounded-full bg-indigo-50 px-3 py-1">
              <Text className="text-[10px] font-semibold text-indigo-700">
                EMPLOYEE
              </Text>
            </View>
          </View>
        </View>

        {/* ---------------- CONTENT ---------------- */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 96,
            paddingTop: 14,
          }}
        >
          {/* PROFILE CARD */}
          <View className="mb-4 rounded-3xl bg-white shadow-[0_6px_18px_rgba(15,23,42,0.09)]">
            {/* Top strip with subtle gradient */}
            <LinearGradient
              colors={["#EEF2FF", "#E0F2FE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-20 rounded-t-3xl"
            />

            {/* Avatar row overlay */}
            <View className="-mt-10 px-4 pb-4">
              <View className="flex-row items-center">
                {/* Avatar */}
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    className="h-16 w-16 rounded-full border-2 border-white bg-slate-100"
                  />
                ) : (
                  <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-slate-100">
                    <Ionicons name="person-outline" size={30} color="#2563EB" />
                  </View>
                )}

                {/* Name + shop + meta */}
                <View className="ml-3 flex-1">
                  <Text
                    className="text-base font-semibold text-slate-900"
                    numberOfLines={1}
                  >
                    {name}
                  </Text>

                  {shopName ? (
                    <Text
                      className="mt-0.5 text-[12px] text-slate-500"
                      numberOfLines={1}
                    >
                      Working at{" "}
                      <Text className="font-semibold text-slate-700">
                        {shopName}
                      </Text>
                    </Text>
                  ) : (
                    <Text className="mt-0.5 text-[12px] text-slate-500">
                      Employee profile
                    </Text>
                  )}

                  {/* small meta row */}
                </View>
              </View>
            </View>
          </View>

          {/* CONTACT CARD – compact, clear */}
          <View className="mb-4 rounded-3xl bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
            <View className="flex-row items-center justify-between rounded-t-3xl bg-indigo-500 px-4 py-3">
              <View className="flex-row items-center">
                <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <Ionicons name="call-outline" size={18} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-xs font-semibold tracking-wide text-white">
                    Contact details
                  </Text>
                  <Text className="text-[10px] text-indigo-100">
                    Keep your primary number active
                  </Text>
                </View>
              </View>
            </View>

            <View className="space-y-3 bg-white px-4 py-4">
              {/* Mobile row */}
              <View className="flex-row items-center">
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-sky-50">
                  <Ionicons name="call-outline" size={18} color="#0EA5E9" />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] text-slate-500">
                    Primary mobile
                  </Text>
                  <Text className="text-sm font-semibold text-slate-900">
                    {mobile || "-"}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View className="h-[1px] rounded-full bg-slate-100" />

              {/* WhatsApp row */}
              <View className="flex-row items-center">
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                  <Ionicons
                    name="logo-whatsapp"
                    size={18}
                    color="#16A34A"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] text-slate-500">
                    WhatsApp (same as mobile)
                  </Text>
                  <Text className="text-sm font-semibold text-slate-900">
                    {mobile || "-"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* WORK LOCATION / SHOP ADDRESS */}
          <View className="mb-5 rounded-3xl bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
            <View className="flex-row items-center justify-between rounded-t-3xl bg-indigo-500 px-4 py-3">
              <View className="flex-row items-center">
                <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <Ionicons name="location-outline" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-xs font-semibold tracking-wide text-white">
                    Working location
                  </Text>
                  <Text className="text-[10px] text-indigo-100">
                    Shop address assigned by the owner
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-white px-4 py-4">
              <View className="flex-row items-start">
                <View className="mt-1 mr-3 h-7 w-7 items-center justify-center rounded-full bg-indigo-50">
                  <Ionicons
                    name="location-sharp"
                    size={18}
                    color="#4F46E5"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs leading-5 text-slate-700">
                    {formatAddress()}
                  </Text>
                  {!shopAddress && (
                    <Text className="mt-2 text-[11px] text-amber-600">
                      Your owner has not added a shop address yet.
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* LOGOUT */}
          <View className="mb-6 rounded-3xl bg-white shadow-[0_6px_18px_rgba(220,38,38,0.25)]">
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-3xl bg-red-500 px-4 py-3"
              onPress={handleLogout}
              activeOpacity={0.9}
            >
              <View className="flex-row items-center">
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-red-100">
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color="#B91C1C"
                  />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-white">
                    Logout
                  </Text>
                  <Text className="text-[11px] text-red-100">
                    Sign out from this device
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FEE2E2" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <AppBottomNav
          active="profile"
          role={effectiveRole}
          id={_id}
          name={name}
          email={email}
          image={avatarUri}
          qrCodeUrl={qrCodeUrl}
          profilePercent={profilePercent ?? 0}
          isVerified={false}
          shopCompleted={shopCompleted}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
