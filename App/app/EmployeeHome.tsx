// app/EmployeeHome.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth, type Role } from "./context/AuthContext";
import { useRequireAuth } from "./hooks/useRequireAuth";

type OwnerSummary = {
  _id: string;
  name?: string;
  shopName?: string;
  shopAddress?: {
    street?: string;
    area?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  isProfileVerified?: boolean;
  shopCompleted?: boolean;
};

export default function EmployeeHome() {
  const router = useRouter();

  const { user, loading } = useRequireAuth();
  const { token } = useAuth();

  const role: Role = (user?.role as Role) || "OWNER";
  const isEmployee = role === "EMPLOYEE";

  const [ownerData, setOwnerData] = useState<OwnerSummary | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);

  /* ---------- Redirect non-employees ---------- */

  useEffect(() => {
    if (!loading && user && !isEmployee) {
      router.replace("/Home");
    }
  }, [loading, user, isEmployee, router]);

  /* ---------- Fetch owner / parentOwner for employee ---------- */

  useEffect(() => {
    if (!user || !isEmployee) return;

    // Use owner or parentOwner from employee document
    const rawOwner = (user as any).owner || (user as any).parentOwner;
    const ownerId =
      typeof rawOwner === "string"
        ? rawOwner
        : rawOwner && typeof rawOwner === "object"
        ? rawOwner._id
        : undefined;

    if (!ownerId) return;

    const fetchOwner = async () => {
      try {
        setOwnerLoading(true);

        const url = SummaryApi.user_get_by_id.url.replace(
          "ID_REPLACE",
          String(ownerId)
        );

        const res = await fetch(`${baseURL}${url}`, {
          method: SummaryApi.user_get_by_id.method,
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });

        const json = await res.json();
        if (json.success && json.user) {
          setOwnerData(json.user as OwnerSummary);
        } else {
          console.log("Owner fetch failed:", json);
        }
      } catch (err) {
        console.log("Owner fetch error:", err);
      } finally {
        setOwnerLoading(false);
      }
    };

    fetchOwner();
  }, [user, token, isEmployee]);

  /* ---------- Loading state ---------- */

  if (loading) {
    return (
      <ExpoLinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#EFF6FF" />
            <Text className="mt-3 text-sm text-white/90">
              Setting up your workspace…
            </Text>
          </View>
        </SafeAreaView>
      </ExpoLinearGradient>
    );
  }

  if (!user) return null;
  if (!isEmployee) return null;

  /* ---------- Derived values ---------- */

  const id = user._id;
  const name = user.name || "Member";
  const email = user.email || "";
  const employmentStatus = (user as any).status || "Active";

  const rawAvatar = user.avatar || "";
  const avatarUrl =
    rawAvatar && !rawAvatar.startsWith("http")
      ? `${baseURL}${rawAvatar}`
      : rawAvatar;

  const qrCodeUrl = user.qrCodeUrl || "";

  const profilePercentEmployee = ownerData?.shopCompleted
    ? 100
    : ownerData?.isProfileVerified
    ? 100
    : 0;

  const isVerifiedEmployee = !!ownerData?.isProfileVerified;
  const shopCompletedEmployee = !!ownerData?.shopCompleted;

  const profilePercent = profilePercentEmployee;
  const isVerified = isVerifiedEmployee;
  const shopCompleted = shopCompletedEmployee;

  const firstLetter = name.trim().charAt(0).toUpperCase() || "M";

  const displayShopName =
    (ownerData?.shopName || user.shopName || "").trim() || "Shop";

  const shopAddressSource = ownerData?.shopAddress || user.shopAddress;

  // ---------- Full address (line1 + line2 + PIN) ----------
  const addressLine1Parts = [
    shopAddressSource?.street?.trim(),
    shopAddressSource?.area?.trim(),
  ].filter(Boolean) as string[];

  const addressLine1 = addressLine1Parts.join(", ");

  const addressLine2Parts = [
    shopAddressSource?.city?.trim(),
    shopAddressSource?.district?.trim(),
    shopAddressSource?.state?.trim(),
  ].filter(Boolean) as string[];

  const addressLine2 = addressLine2Parts.join(", ");

  const addressPincode = shopAddressSource?.pincode;

  /* ---------- Navigation helpers ---------- */

  const goProfile = () =>
    router.push({
      pathname: "/EmployeeProfile",
      params: { id, name, email, role, image: avatarUrl },
    });

  const goMyQR = () =>
    router.push({
      pathname: "/MyQRCode",
      params: {
        role,
        name,
        email,
        qrCodeUrl,
        isVerified: String(isVerified),
      },
    });

  const goScanQR = () =>
    router.push({
      pathname: "/ScanQR",
      params: {
        role,
        name,
        email,
      },
    });

  const goHistory = () =>
    router.push({
      pathname: "/ScanHistory",
      params: {
        role,
        id,
        name,
        email,
        image: avatarUrl,
        qrCodeUrl,
        profilePercent: String(profilePercent ?? 0),
        isVerified: String(isVerified),
      },
    });

  const quickAccessItems = [
    {
      title: "My QR Code",
      desc: "Show & share your QR instantly.",
      icon: "qr-code-outline" as const,
      color: "#EC4899",
      bg: "#FDF2F8",
      onPress: goMyQR,
    },
    {
      title: "Scan QR",
      desc: "Scan member QR (Buy / Return).",
      icon: "scan-circle-outline" as const,
      color: "#2563EB",
      bg: "#E0F2FE",
      onPress: goScanQR,
    },
    {
      title: "Scan History",
      desc: "View all Buy / Return scans.",
      icon: "time-outline" as const,
      color: "#7C3AED",
      bg: "#EDE9FE",
      onPress: goHistory,
    },
  ];

  /* ---------- Render ---------- */

  return (
    <ExpoLinearGradient
      colors={["#1D4ED8", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* ================= HEADER (Hero – gradient cover + circle avatar) ================= */}
        <View className="px-4 pt-1">
          <TouchableOpacity
            onPress={goProfile}
            activeOpacity={0.9}
            className="overflow-hidden rounded-3xl bg-slate-900/10 shadow-[0_14px_30px_rgba(15,23,42,0.35)]"
          >
            {/* Cover (ONLY gradient now, no shopBanner) */}
            <View style={{ height: 150 }}>
              <ExpoLinearGradient
                colors={["#1D4ED8", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1"
              />
            </View>

            {/* Circle avatar positioned over cover */}
            <View className="absolute left-0 right-0 top-[50px] z-10 items-center">
              <View className="h-[150px] w-[150px] overflow-hidden rounded-full border-[4px] border-white bg-slate-900/10">
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    className="h-full w-full rounded-full"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-2xl font-semibold text-white">
                      {firstLetter}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Text section under avatar */}
            <View className="items-center bg-white px-4 pb-4 pt-16">
              <Text
                className="text-base font-semibold text-slate-900"
                numberOfLines={1}
              >
                {name}
              </Text>

              <View className="mt-2 flex-row items-center">
                <View className="flex-row items-center rounded-full bg-slate-100 px-3 py-1">
                  <Ionicons
                    name="briefcase-outline"
                    size={14}
                    color="#4B5563"
                  />
                  <Text className="ml-1 text-[11px] font-medium text-slate-700">
                    Employee · {employmentStatus}
                  </Text>
                </View>

                {isVerified && (
                  <View className="ml-2 flex-row items-center rounded-full bg-emerald-50 px-3 py-1">
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={13}
                      color="#059669"
                    />
                    <Text className="ml-1 text-[11px] font-medium text-emerald-700">
                      Owner verified
                    </Text>
                  </View>
                )}
              </View>

              <Text
                className="mt-3 text-[15px] font-semibold text-slate-900"
                numberOfLines={1}
              >
                {displayShopName}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ================= MAIN CONTENT ================= */}
        <ScrollView className="mt-4 flex-1 px-4">
          {/* ---- Work location card (WHITE) ---- */}
          {(ownerData || shopAddressSource) && (
            <View className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 flex-row items-center">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#4F46E5"
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Working location
                    </Text>
                    <Text
                      className="text-[14px] font-semibold text-slate-900"
                      numberOfLines={1}
                    >
                      {displayShopName}
                    </Text>
                    {ownerData?.name ? (
                      <Text
                        className="mt-0.5 text-[11px] text-slate-500"
                        numberOfLines={1}
                      >
                        Owner: {ownerData.name}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View className="my-3 h-px rounded-full bg-slate-100" />

              {ownerLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#9CA3AF" />
                  <Text className="ml-2 text-[11px] text-slate-400">
                    Loading owner details…
                  </Text>
                </View>
              ) : shopAddressSource ? (
                <View className="flex-row items-start">
                  <View className="mr-3 mt-1 h-7 w-7 items-center justify-center rounded-full bg-indigo-50">
                    <Ionicons
                      name="location-sharp"
                      size={18}
                      color="#4F46E5"
                    />
                  </View>
                  <View className="flex-1">
                    {addressLine1 ? (
                      <Text className="text-[13px] text-slate-800">
                        {addressLine1}
                      </Text>
                    ) : null}
                    {addressLine2 ? (
                      <Text className="mt-0.5 text-[12px] text-slate-600">
                        {addressLine2}
                      </Text>
                    ) : null}
                    {addressPincode ? (
                      <Text className="mt-0.5 text-[12px] text-slate-600">
                        PIN: {addressPincode}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : (
                <Text className="text-[11px] text-amber-600">
                  Your owner has not added a shop address yet.
                </Text>
              )}
            </View>
          )}

          {/* ---- Quick Access section ---- */}
          <View className="mt-6">
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="text-base font-semibold text-white">
                Quick actions
              </Text>
              <View className="flex-row items-center">
                <Ionicons
                  name="flash-outline"
                  size={14}
                  color="rgba(239,246,255,0.9)"
                />
                <Text className="ml-1 text-[11px] text-white/80">
                  For your daily work
                </Text>
              </View>
            </View>

            <Text className="mb-3 text-[11px] text-white/75">
              Access your most-used tools in one tap.
            </Text>

            <View className="flex-row flex-wrap justify-between">
              {quickAccessItems.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={item.onPress}
                  className="mb-4 w-[48%] items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                  activeOpacity={0.9}
                >
                  <View
                    className="h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: item.bg }}
                  >
                    <Ionicons name={item.icon} size={26} color={item.color} />
                  </View>

                  <Text className="mt-3 text-center text-sm font-semibold text-gray-900">
                    {item.title}
                  </Text>

                  <Text className="mt-1 text-center text-xs leading-4 text-gray-500">
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>

        <AppBottomNav
          active="home"
          role={role}
          id={id}
          name={name}
          email={email}
          image={avatarUrl}
          qrCodeUrl={qrCodeUrl}
          profilePercent={profilePercent}
          isVerified={isVerified}
          shopCompleted={shopCompleted}
        />
      </SafeAreaView>
    </ExpoLinearGradient>
  );
}
