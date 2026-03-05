import { Ionicons } from "@expo/vector-icons";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SummaryApi, { baseURL, path } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import SpeedNeedle from "./components/SpeedNeedle";
import type { Role } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext"; 

type Association = {
  _id?: string;
  name?: string;
  district?: string;
  area?: string;
  logo?: string;
};

/* ---------- Gauge config (responsive) ---------- */
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAUGE_SIZE = Math.min(220, Math.max(160, SCREEN_WIDTH * 0.7));

export default function Home() {
  const router = useRouter();

  // ✅ DO NOT redirect in this screen. _layout.tsx is the only redirect guard.
  const { user, token, loading } = useAuth();

  // Association state
  const [associationName, setAssociationName] = useState("");
  const [associationDistrict, setAssociationDistrict] = useState("");
  const [associationArea, setAssociationArea] = useState("");
  const [associationLogo, setAssociationLogo] = useState("");
  const [associationLoading, setAssociationLoading] = useState(false);

  // ✅ Load Association details (from embedded object or via API)
  useEffect(() => {
    if (!user || !token) return;

    const assoc = user.association as Association | string | undefined;
    if (!assoc) return;

    // If association object embedded in user
    if (typeof assoc === "object") {
      setAssociationName(assoc.name || "");
      setAssociationDistrict(assoc.district || "");
      setAssociationArea(assoc.area || "");
      const logo = assoc.logo || "";
      setAssociationLogo(
        logo && !logo.startsWith("http") ? `${baseURL}${logo}` : logo
      );
      return;
    }

    // If association is an ID – load via API
    const associationId = String(assoc);
    if (!associationId) return;

    const fetchAssociation = async () => {
      try {
        setAssociationLoading(true);

        const url = path(SummaryApi.getAssociationById.url, {
          id: associationId,
        });

        const res = await fetch(`${baseURL}${url}`, {
          method: SummaryApi.getAssociationById.method,
        });

        const json = await res.json();
        if (json.success && json.data) {
          setAssociationName(json.data.name || "");
          setAssociationDistrict(json.data.district || "");
          setAssociationArea(json.data.area || "");
          const logo = json.data.logo || "";
          setAssociationLogo(
            logo && !logo.startsWith("http") ? `${baseURL}${logo}` : logo
          );
        }
      } catch (err) {
        console.log("Association fetch error:", err);
      } finally {
        setAssociationLoading(false);
      }
    };

    fetchAssociation();
  }, [user, token]);

  // ---------- Derived values that do NOT create hooks ----------
  const profilePercent = user?.profilePercent ?? 0;
  const profileBreakdown = (user as any)?.profileBreakdown || {};
  const shopCompleted = !!user?.shopCompleted;
  const isVerified = !!user?.isProfileVerified;
  const qrCodeUrl = user?.qrCodeUrl || "";

  const progressValue = Math.min(profilePercent, 100);

  // ---- Gauge animation hooks MUST stay before any early return ----
  const needleProgress = useRef(new Animated.Value(progressValue)).current;

  useEffect(() => {
    Animated.timing(needleProgress, {
      toValue: progressValue,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [progressValue, needleProgress]);

  // Map 0–100% -> -90deg … +90deg
  const needleRotate = needleProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ["-90deg", "90deg"],
    extrapolate: "clamp",
  });

  // ---------- Early UI returns (NO redirect here) ----------
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
            <Text className="text-sm text-white/90">Loading...</Text>
          </View>
        </SafeAreaView>
      </ExpoLinearGradient>
    );
  }

  // ✅ If logged out, render nothing.
  // _layout.tsx will redirect to Login/Onboarding (single source of truth).
  if (!user || !token) return null;

  // ---------- Derived values from user (safe now, user is defined) ----------
  const id = user._id;
  const name = user.name || "Member";
  const email = user.email || "";
  const role: Role = (user.role as Role) || "OWNER";
  const shopName = user.shopName || "";

  const rawAvatar = user.avatar || "";
  const image =
    rawAvatar && !rawAvatar.startsWith("http")
      ? `${baseURL}${rawAvatar}`
      : rawAvatar;

  const rawShopBanner = user.shopBanner || "";
  const shopBannerImage =
    rawShopBanner && !rawShopBanner.startsWith("http")
      ? `${baseURL}${rawShopBanner}`
      : rawShopBanner;

  const firstLetter = name.trim().charAt(0).toUpperCase() || "M";

  // ---- Gauge zone & colors (3 segments) ----
  // Red:   0 – 33%
  // Yellow:34 – 66%
  // Green: 67 – 100%
  const gaugeZone =
    progressValue <= 33 ? "LOW" : progressValue <= 66 ? "MID" : "HIGH";

  const gaugeTextColor =
    gaugeZone === "LOW"
      ? "#B91C1C"
      : gaugeZone === "MID"
      ? "#92400E"
      : "#15803D";

  // ---- Steps for tiles ----
  const STEP_CONFIG = [
    { key: "profileBasics", label: "Profile basics", max: 25 },
    { key: "memberAddress", label: "Address", max: 20 },
    { key: "shopBasic", label: "Shop basic", max: 15 },
    { key: "shopAddress", label: "Shop address", max: 20 },
    { key: "shopPhotos", label: "Shop photos", max: 20 },
  ] as const;

  const stepItems = STEP_CONFIG.map((s) => {
    const value = profileBreakdown[s.key] ?? 0;
    const done = value >= s.max - 0.01;
    return { ...s, value, done };
  });

  // ---------- Navigation handlers ----------
  const goProfile = () =>
    router.push({
      pathname: "/Profile",
      params: { id, name, email, role, image },
    });

  const goShop = () => router.push("/SubscriptionHistory");

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
        image,
        qrCodeUrl,
        profilePercent: String(profilePercent ?? 0),
        isVerified: String(isVerified),
      },
    });

  return (
    <ExpoLinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* ------------ HEADER (cover + avatar) ------------- */}
        {shopBannerImage ? (
          <View className="px-4 pt-3">
            <View className="rounded-3xl overflow-hidden">
              <ImageBackground
                source={{ uri: shopBannerImage }}
                resizeMode="cover"
                style={{ height: 150 }}
                imageStyle={{ borderRadius: 24 }}
              />
            </View>

            <TouchableOpacity
              onPress={goProfile}
              activeOpacity={0.9}
              className="items-center -mt-20"
            >
              <View className="relative">
                <View className="w-[130px] h-[130px] rounded-full border-[3px] border-white bg-slate-200 overflow-hidden">
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-xl font-semibold text-slate-700">
                        {firstLetter}
                      </Text>
                    </View>
                  )}
                </View>

                {isVerified && (
                  <View className="absolute right-3 top-3 w-8 h-8 rounded-full bg-emerald-500 border-[3px] border-white items-center justify-center">
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </View>
                )}
              </View>

              <Text className="mt-2 text-base font-semibold text-white">
                {name}
              </Text>

              <View className="mt-1 flex-row items-center justify-center">
                {!!shopName && (
                  <Text
                    className="text-[13px] font-semibold text-white"
                    numberOfLines={1}
                  >
                    {shopName}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <ExpoLinearGradient
            colors={["#2563EB", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-4 pt-6 pb-8 rounded-b-3xl shadow-md"
          >
            <TouchableOpacity
              onPress={goProfile}
              activeOpacity={0.9}
              className="items-center"
            >
              <View className="relative">
                <View className="w-24 h-24 rounded-full border-[3px] border-white bg-white/10 overflow-hidden">
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-xl font-semibold text-white">
                        {firstLetter}
                      </Text>
                    </View>
                  )}
                </View>

                {isVerified && (
                  <View className="absolute right-0 top-0 w-7 h-7 rounded-full bg-emerald-500 border-[2px] border-white items-center justify-center">
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </View>

              <Text className="mt-2 text-lg font-semibold text-white">
                {name}
              </Text>

              {!!shopName && (
                <Text className="mt-0 text-sm font-semibold text-white/90">
                  {shopName}
                </Text>
              )}
            </TouchableOpacity>
          </ExpoLinearGradient>
        )}

        {/* ------------ MAIN CONTENT ------------- */}
        <ScrollView
          className="flex-1 px-4 mt-0"
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* ================= PROFILE STATISTICS ================= */}
          <View className="bg-white rounded-3xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] border border-slate-100 mt-2">
            {/* Header */}
            <View className="flex-row items-center justify-between ">
              <View>
                <Text className="text-base font-semibold text-slate-900">
                  My Status
                </Text>
              </View>

              <View className="flex-row items-center px-2 py-1 rounded-full bg-slate-50">
                <Text className="text-[11px] text-slate-500 mr-1">Overall</Text>
                <Ionicons name="chevron-down" size={14} color="#94A3B8" />
              </View>
            </View>

            {/* Status tiles */}
            <View className="flex-row flex-wrap -mx-1">
              {(() => {
                // Individual step flags
                const profileBasicsStep = stepItems.find(
                  (s) => s.key === "profileBasics"
                );
                const memberAddressStep = stepItems.find(
                  (s) => s.key === "memberAddress"
                );
                const shopBasicStep = stepItems.find(
                  (s) => s.key === "shopBasic"
                );
                const shopAddressStep = stepItems.find(
                  (s) => s.key === "shopAddress"
                );
                const shopPhotosStep = stepItems.find(
                  (s) => s.key === "shopPhotos"
                );

                // Profile tile: ONLY profileBasics
                const profileBasicsDone = profileBasicsStep?.done ?? false;
                const profileSectionDone = profileBasicsDone;

                // Shop tile: ALL 4 must be done
                const shopDetailsDone =
                  (memberAddressStep?.done ?? false) &&
                  (shopBasicStep?.done ?? false) &&
                  (shopAddressStep?.done ?? false) &&
                  (shopPhotosStep?.done ?? false);

                const rawKycStatus =
                  (user as any)?.kycStatus || (user as any)?.kyc?.status || "";
                const normalizedKyc = rawKycStatus
                  ? String(rawKycStatus).toUpperCase()
                  : "";
                const isKycCompleted =
                  normalizedKyc === "APPROVED" ||
                  normalizedKyc === "COMPLETED" ||
                  normalizedKyc === "VERIFIED";
                const kycLabel = normalizedKyc
                  ? normalizedKyc.charAt(0) +
                    normalizedKyc.slice(1).toLowerCase()
                  : "Pending";

                const verificationLabel = isVerified
                  ? "Approved"
                  : progressValue === 100
                  ? "Waiting admin"
                  : "Pending";

                const verificationColor = isVerified ? "#16A34A" : "#E11D48";
                const shopLabel = shopDetailsDone ? "Completed" : "Pending";

                return (
                  <>
                    {/* Profile (only basics) */}
                    <View className="w-1/2 px-1 mb-2">
                      <View className="bg-sky-50 rounded-2xl px-3 py-2">
                        <Text className="text-[11px] text-slate-500">
                          Profile
                        </Text>
                        <View className="flex-row items-center justify-between mt-1">
                          <View>
                            <Text className="text-[13px] font-semibold text-slate-900">
                              {profileSectionDone ? "Completed" : "Incomplete"}
                            </Text>
                            <Text className="text-[11px] text-slate-500">
                              Basics
                            </Text>
                          </View>
                          <View className="w-7 h-7 rounded-full bg-sky-100 items-center justify-center">
                            <Ionicons
                              name={
                                profileSectionDone
                                  ? "checkmark-circle"
                                  : "person-circle-outline"
                              }
                              size={18}
                              color="#0284C7"
                            />
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* KYC */}
                    <View className="w-1/2 px-1 mb-2">
                      <View className="bg-amber-50 rounded-2xl px-3 py-2">
                        <Text className="text-[11px] text-slate-500">KYC</Text>
                        <View className="flex-row items-center justify-between mt-1">
                          <View>
                            <Text className="text-[13px] font-semibold text-slate-900">
                              {kycLabel}
                            </Text>
                            <Text className="text-[11px] text-slate-500">
                              Aadhaar / docs
                            </Text>
                          </View>
                          <View className="w-7 h-7 rounded-full bg-amber-100 items-center justify-center">
                            <Ionicons
                              name={
                                isKycCompleted
                                  ? "document-text"
                                  : "document-outline"
                              }
                              size={18}
                              color="#D97706"
                            />
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Shop (all 4 sections) */}
                    <View className="w-1/2 px-1 mb-2">
                      <View className="bg-emerald-50 rounded-2xl px-3 py-2">
                        <Text className="text-[11px] text-slate-500">Shop</Text>
                        <View className="flex-row items-center justify-between mt-1">
                          <View>
                            <Text className="text-[13px] font-semibold text-slate-900">
                              {shopLabel}
                            </Text>
                            <Text className="text-[11px] text-slate-500">
                              Details & photos
                            </Text>
                          </View>
                          <View className="w-7 h-7 rounded-full bg-emerald-100 items-center justify-center">
                            <Ionicons
                              name={
                                shopDetailsDone
                                  ? "storefront"
                                  : "storefront-outline"
                              }
                              size={18}
                              color="#059669"
                            />
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Verification */}
                    <View className="w-1/2 px-1 mb-2">
                      <View className="bg-slate-50 rounded-2xl px-3 py-2">
                        <Text className="text-[11px] text-slate-500">
                          Verification
                        </Text>
                        <View className="flex-row items-center justify-between mt-1">
                          <View>
                            <Text className="text-[13px] font-semibold text-slate-900">
                              {verificationLabel}
                            </Text>
                            <Text className="text-[11px] text-slate-500">
                              Admin approval
                            </Text>
                          </View>
                          <View className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center">
                            <Ionicons
                              name={
                                isVerified
                                  ? "shield-checkmark"
                                  : "shield-half-outline"
                              }
                              size={18}
                              color={verificationColor}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>

            {/* Section title for completion */}
            <View className="flex-row items-center justify-between mt-1 mb-1">
              <Text className="text-xs font-semibold text-slate-500 uppercase tracking-[1.4px]">
                Profile Completion
              </Text>
              <Text className="text-[11px] text-slate-400">
                Score: {progressValue}%
              </Text>
            </View>

            {/* === GAUGE METER (3 zones + PNG needle) === */}
            <View className="items-center justify-center mt-1">
              <View
                style={{
                  width: GAUGE_SIZE,
                  height: GAUGE_SIZE / 2,
                  overflow: "hidden",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                {/* OUTER GREY SEMI-CIRCLE */}
                <View
                  style={{
                    position: "absolute",
                    width: GAUGE_SIZE,
                    height: GAUGE_SIZE,
                    bottom: -GAUGE_SIZE / 2,
                    borderRadius: GAUGE_SIZE,
                    backgroundColor: "#E5E7EB",
                  }}
                />

                {/* COLORED BAND: RED | YELLOW | GREEN */}
                <View
                  style={{
                    position: "absolute",
                    width: GAUGE_SIZE * 0.86,
                    height: GAUGE_SIZE * 0.86,
                    bottom: -GAUGE_SIZE * 0.43,
                    borderRadius: GAUGE_SIZE,
                    overflow: "hidden",
                  }}
                >
                  <ExpoLinearGradient
                    colors={[
                      "#EF4444",
                      "#EF4444",
                      "#FBBF24",
                      "#FBBF24",
                      "#22C55E",
                      "#22C55E",
                    ]}
                    locations={[0, 0.33, 0.33, 0.66, 0.66, 1]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}
                  />
                </View>

                {/* INNER WHITE CUT-OUT */}
                <View
                  style={{
                    position: "absolute",
                    width: GAUGE_SIZE * 0.66,
                    height: GAUGE_SIZE * 0.66,
                    bottom: -GAUGE_SIZE * 0.33,
                    borderRadius: GAUGE_SIZE,
                    backgroundColor: "#F9FAFB",
                  }}
                />

                {/* NEEDLE + HUB (PNG needle) */}
                <View
                  style={{
                    position: "absolute",
                    width: GAUGE_SIZE,
                    height: GAUGE_SIZE,
                    bottom: -GAUGE_SIZE / 2,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Rotating wrapper */}
                  <Animated.View
                    style={{
                      transform: [{ rotate: needleRotate }],
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: GAUGE_SIZE * 0.08,
                    }}
                    className="z-10"
                  >
                    <SpeedNeedle size={GAUGE_SIZE * 0.32} />
                  </Animated.View>

                  {/* Center circular hub to mask base */}
                  <View
                    style={{
                      position: "absolute",
                      width: GAUGE_SIZE * 0.25,
                      height: GAUGE_SIZE * 0.25,
                      borderRadius: (GAUGE_SIZE * 0.25) / 2,
                      backgroundColor: "#FFFFFF",
                      borderWidth: 2,
                      borderColor: "#E5E7EB",
                      shadowColor: "#000",
                      shadowOpacity: 0.08,
                      shadowOffset: { width: 0, height: 1 },
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  />
                </View>
              </View>

              {/* Label under gauge */}
              <Text className="mt-2 text-xs text-slate-500">
                Profile completion :{" "}
                <Text
                  className="font-semibold"
                  style={{ color: gaugeTextColor }}
                >
                  {progressValue}%
                </Text>
              </Text>
            </View>
          </View>

          {/* Association card */}
          {associationName ? (
            <View className="bg-white rounded-2xl p-4 shadow-sm mt-2 flex-row items-center">
              <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mr-3 overflow-hidden">
                {associationLogo ? (
                  <Image
                    source={{ uri: associationLogo }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="business-outline" size={26} color="#666" />
                )}
              </View>

              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Association
                </Text>
                <Text className="text-base font-semibold text-gray-900 mt-0.5">
                  {associationName}
                </Text>
                <Text className="text-[12px] text-gray-600 mt-1">
                  {associationDistrict || "-"}
                  {associationArea ? `  •  ${associationArea}` : ""}
                </Text>
              </View>
            </View>
          ) : associationLoading ? (
            <View className="bg-white rounded-2xl p-4 shadow-sm mt-4">
              <Text className="text-xs text-gray-500">
                Loading association details...
              </Text>
            </View>
          ) : null}

          {/* Quick Access */}
          <View className="mt-6">
            <Text className="text-base font-semibold text-white mb-3">
              Quick Access
            </Text>

            <View className="flex-row flex-wrap justify-between">
              {[
                {
                  title: "My Subscription",
                  desc: "View subscription details.",
                  icon: "storefront-outline" as const,
                  color: "#2563EB",
                  bg: "#EFF6FF",
                  onPress: goShop,
                },
                {
                  title: "My QR Code",
                  desc: "Show & share your QR quickly.",
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
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={item.onPress}
                  className="w-[48%] bg-white rounded-2xl p-4 shadow-sm mb-4 items-center"
                >
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: item.bg }}
                  >
                    <Ionicons name={item.icon} size={26} color={item.color} />
                  </View>

                  <Text className="mt-3 text-sm font-semibold text-gray-900 text-center">
                    {item.title}
                  </Text>

                  <Text className="mt-1 text-xs text-gray-500 text-center leading-4">
                    {item.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>

        {/* Bottom nav */}
        <AppBottomNav
          active="home"
          role={role}
          id={id}
          name={name}
          email={email}
          image={image}
          qrCodeUrl={qrCodeUrl}
          profilePercent={profilePercent}
          isVerified={isVerified}
          shopCompleted={shopCompleted}
        />
      </SafeAreaView>
    </ExpoLinearGradient>
  );
}
