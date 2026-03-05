// app/MyQRCode.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";

import { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth } from "./context/AuthContext";
import { useRequireAuth } from "./hooks/useRequireAuth";

export default function MyQRCode() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 🔐 Guard + redirect if not logged in
  const { user } = useRequireAuth();

  // For logout / clearAuth
  const { clearAuth } = useAuth();

  const [saving, setSaving] = useState(false);
  const [qrUrlState, setQrUrlState] = useState<string>(""); // fetched from backend
  const [qrType, setQrType] = useState<"OWNER" | "EMPLOYEE" | null>(null); // optional, for future use
  const posterRef = useRef<ViewShot | null>(null);

  const paramRole = (params.role as string) || "USER";
  const paramQrCodeUrl = (params.qrCodeUrl as string) || "";
  const paramIsVerified = (params.isVerified as string) === "true";

  const role = (user?.role as string) || paramRole || "USER";
  const name = user?.name || (params.name as string) || "Member";
  const email = user?.email || (params.email as string) || "";

  // Fallback QR from user/params, but prefer state loaded from /api/qr/my
  const fallbackQrUrl = user?.qrCodeUrl || paramQrCodeUrl;
  const qrCodeUrl = qrUrlState || fallbackQrUrl;

  const isVerified = user?.isProfileVerified ?? paramIsVerified;
  const profilePercent = user?.profilePercent ?? 0;
  const shopCompleted = user?.shopCompleted ?? false;
  const ownerVerified = (user as any)?.ownerVerified ?? true;

  const shopName = user?.shopName || "Shop Name";
  const mobile = user?.mobile || "";

  const ownerBlocked = role === "OWNER" && !isVerified;
  const employeeBlocked = role === "EMPLOYEE" && !ownerVerified;

  // Avatar / shop images
  const rawAvatar = user?.avatar || "";
  const avatarImage =
    rawAvatar && !rawAvatar.startsWith("http")
      ? `${baseURL}${rawAvatar}`
      : rawAvatar;

  const shopBanner =
    (user?.shopBanner &&
      (user.shopBanner.startsWith("http")
        ? user.shopBanner
        : `${baseURL}${user.shopBanner}`)) ||
    "";

  // For poster header → prefer shopBanner, fallback avatar
  const posterImage = avatarImage;

  /* ---------------------------------------
   * Fetch QR from backend for current user
   * --------------------------------------*/
  useEffect(() => {
    const fetchMyQr = async () => {
      try {
        const res = await fetch(`${baseURL}/api/qr/my`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const json = await res.json();
        if (!json.success) {
          console.log("getMyQr failed:", json);
          return;
        }

        if (json.qrCodeUrl) {
          setQrUrlState(json.qrCodeUrl);
        }
        if (json.type === "OWNER" || json.type === "EMPLOYEE") {
          setQrType(json.type);
        }

        // If backend returns shopName for employee, you could also use it
        // but for now we keep using user.shopName
      } catch (e) {
        console.log("getMyQr error:", e);
      }
    };

    fetchMyQr();
  }, []);

  const handleLogout = async () => {
    try {
      try {
        await fetch(`${baseURL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        console.log("logout request error (ignored):", e);
      }

      await clearAuth();
      router.replace("/Login");
    } catch (e) {
      console.log("logout error:", e);
    }
  };

  const handleDownloadPoster = async () => {
    try {
      // Extra guard: poster is not ready
      if (!posterRef.current) {
        Alert.alert(
          "Please wait",
          "Poster is still loading. Try again in a moment."
        );
        return;
      }

      setSaving(true);

      // Request permission normally
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        const msg = canAskAgain
          ? "Please allow photo permission to save the QR poster."
          : "Photo permission is blocked. Enable it from Settings to save the QR poster.";

        Alert.alert("Permission needed", msg);
        setSaving(false);
        return;
      }

      // Capture the poster view
      const uri = await posterRef.current.capture?.();
      console.log("ViewShot URI (debug):", uri);

      if (!uri || typeof uri !== "string") {
        throw new Error("CAPTURE_FAILED");
      }

      // Save to gallery
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved", "QR poster saved to your gallery.");
    } catch (err: any) {
      console.log("download poster error:", err);

      if (
        typeof err?.message === "string" &&
        err.message.includes(
          "Expo Go can no longer provide full access to the media library"
        )
      ) {
        Alert.alert(
          "Not supported in Expo Go",
          "To download the QR poster, please install the development build or production app."
        );
      } else if (err?.message === "CAPTURE_FAILED") {
        Alert.alert(
          "Error",
          "Could not capture the poster. Please wait for the QR to load and try again."
        );
      } else {
        Alert.alert(
          "Error",
          "Could not save the poster. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const HeaderBar = () => (
    <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
      <TouchableOpacity onPress={() => router.replace("/Home")}>
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <Text className="text-white text-base font-semibold">
        My QR Code
      </Text>

      {role === "EMPLOYEE" ? (
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 22 }} />
      )}
    </View>
  );

  // 🔗 avatar -> Profile screen
  const goProfile = () => {
    router.push("/Profile");
  };

  // ---- BLOCKED STATES (OWNER / EMPLOYEE) ----
  if (ownerBlocked || employeeBlocked) {
    const isOwner = role === "OWNER";

    return (
      <LinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <HeaderBar />

          <View className="flex-1 items-center justify-center px-6">
            <View className="w-full rounded-3xl bg-white/95 p-5 shadow-xl">
              <Text className="mb-2 text-lg font-semibold text-slate-900">
                QR Locked
              </Text>
              <Text className="text-sm text-slate-600">
                {isOwner
                  ? "Your profile is not verified yet. QR code will be enabled after admin verification."
                  : "Your owner profile is not verified yet. QR code will be enabled after admin verification."}
              </Text>
            </View>
          </View>

          <AppBottomNav
            active="qr"
            role={role as any}
            id={user?._id}
            name={user?.name}
            email={user?.email}
            image={user?.avatar}
            qrCodeUrl={qrCodeUrl}
            profilePercent={profilePercent}
            isVerified={!!isVerified}
            shopCompleted={shopCompleted}
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ---- NORMAL CONTENT STATES ----
  const renderContent = () => {
    // Not verified yet
    if (!isVerified) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full rounded-3xl bg-white/95 p-5 shadow-xl">
            <Text className="text-sm text-slate-700 text-center">
              Waiting for admin verification. Your QR will be activated after
              approval.
            </Text>
          </View>
        </View>
      );
    }

    // Verified but QR missing
    if (!qrCodeUrl) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full rounded-3xl bg-white/95 p-5 shadow-xl">
            <Text className="text-sm text-slate-700 text-center">
              QR code not available. Please contact admin.
            </Text>
          </View>
        </View>
      );
    }

    // ✅ MAIN QR UI + POSTER (gradient background INSIDE the poster)
    return (
      <View className="flex-1 items-center mt-6 px-6">
        {/* Poster wrapped in ViewShot for download */}
        <ViewShot
          ref={posterRef}
          options={{ format: "png", quality: 1, result: "tmpfile" }}
          style={{ borderRadius: 24, overflow: "hidden" }}
        >
          {/* Gradient poster background (this is what gets saved) */}
          <LinearGradient
            colors={["#2563EB", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-[290px] rounded-3xl pt-6 pb-6 items-center"
          >
            {/* Top avatar + shop name on gradient */}
            <View className="items-center px-4">
              <View className="w-16 h-16 rounded-full bg-white/90 overflow-hidden mb-2">
                {posterImage ? (
                  <Image
                    source={{ uri: posterImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-slate-700 text-xl font-semibold">
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                className="text-white text-base font-semibold"
                numberOfLines={1}
              >
                {shopName}
              </Text>
            </View>

            {/* White QR block */}
            <View className="mt-4 bg-white rounded-3xl px-4 pt-4 pb-5 w-[250px] items-center">
              {/* QR Code */}
              <View className="bg-white rounded-2xl p-2 border border-slate-200">
                <Image
                  source={{ uri: qrCodeUrl }}
                  className="w-[210px] h-[210px]"
                  resizeMode="contain"
                />
              </View>

              {/* Owner & contact */}
              <View className="mt-4 items-center">
                <Text className="text-sm font-medium text-slate-900">
                  {name}
                </Text>
                {mobile ? (
                  <Text className="text-xs text-slate-600 mt-1">
                    Mobile: {mobile}
                  </Text>
                ) : null}
              </View>
            </View>
          </LinearGradient>
        </ViewShot>

        {/* Download button */}
        <TouchableOpacity
          onPress={handleDownloadPoster}
          activeOpacity={0.8}
          className="mt-6 flex-row items-center justify-center px-5 py-3 rounded-full bg-white/90"
          disabled={saving}
        >
          <Ionicons name="download-outline" size={18} color="#2563EB" />
          <Text className="ml-2 text-sm font-semibold text-blue-700">
            {saving ? "Saving..." : "Download QR Poster"}
          </Text>
        </TouchableOpacity>

        {/* Email under poster (optional) */}
        {email ? (
          <Text className="mt-3 text-white/80 text-[11px]">{email}</Text>
        ) : null}

        {/* Footer */}
        <Text className="mt-6 text-white/60 text-[10px] text-center">
          © 2025, All rights reserved. Globo Green Tech System Pvt.Ltd
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <HeaderBar />

        {/* Avatar row under header – tap to open Profile */}
        <View className="px-4 mt-1 mb-1">
          <TouchableOpacity
            onPress={goProfile}
            activeOpacity={0.9}
            className="flex-row items-center"
          >
            <View className="w-10 h-10 rounded-full bg-white/20 overflow-hidden items-center justify-center">
              {avatarImage ? (
                <Image
                  source={{ uri: avatarImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-white font-semibold">
                  {name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View className="ml-3">
              <Text className="text-white text-sm font-semibold">
                {name}
              </Text>
              <Text className="text-white/80 text-[11px]" numberOfLines={1}>
                {shopName}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {renderContent()}

        <AppBottomNav
          active="home"
          role={role as any}
          id={user?._id}
          name={user?.name}
          email={user?.email}
          image={user?.avatar}
          qrCodeUrl={qrCodeUrl}
          profilePercent={profilePercent}
          isVerified={!!isVerified}
          shopCompleted={shopCompleted}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
