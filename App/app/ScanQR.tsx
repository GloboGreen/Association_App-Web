// app/ScanQR.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  BarcodeScanningResult,
  Camera,
  CameraView,
} from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth } from "./context/AuthContext";
import { useRequireAuth } from "./hooks/useRequireAuth";

type Role = "OWNER" | "EMPLOYEE" | "USER";

export default function ScanQR() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ---------- AUTH HOOKS ----------
  const { user, loading } = useRequireAuth();
  const { token, clearAuth } = useAuth();

  // ---------- CAMERA HOOKS (must run ALWAYS) ----------
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);

  // ---------- ROLE & USER DATA (safe access) ----------
  const paramRole = (params.role as string) || "USER";
  const userRole = (user?.role as string) || "USER";

  const role: Role =
    userRole === "OWNER" || userRole === "EMPLOYEE" || userRole === "USER"
      ? (userRole as Role)
      : ((paramRole as Role) || "USER");

  const name = user?.name || (params.name as string) || "Member";
  const email = user?.email || (params.email as string) || "";

  const qrCodeUrl = (user as any)?.qrCodeUrl || "";
  const profilePercent = (user as any)?.profilePercent ?? 0;
  const shopCompleted = (user as any)?.shopCompleted ?? false;
  const isVerified = !!(user as any)?.isProfileVerified;
  const ownerVerified = (user as any)?.ownerVerified ?? true;

  const isScanAllowed = role === "OWNER" || role === "EMPLOYEE";
  const ownerBlocked = role === "OWNER" && !isVerified;
  const employeeBlocked = role === "EMPLOYEE" && !ownerVerified;

  // ---------- CAMERA PERMISSION ----------
  useEffect(() => {
    if (!isScanAllowed) return;
    if (ownerBlocked || employeeBlocked) return;

    (async () => {
      const res = await Camera.requestCameraPermissionsAsync();
      setHasPermission(res.status === "granted");
    })();
  }, [isScanAllowed, ownerBlocked, employeeBlocked]);

  // ---------- LOGOUT ----------
  const handleLogout = async () => {
    try {
      try {
        await fetch(`${baseURL}${SummaryApi.logout.url}`, {
          method: SummaryApi.logout.method,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
      } catch {}

      await clearAuth();
      router.replace("/Login");
    } catch {}
  };

  // ---------- SCAN EVENT ----------
  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    if (!result?.data) {
      Alert.alert("Scan failed", "Could not read this QR. Try again.");
      setScanned(false);
      return;
    }

    router.push({
      pathname: "/ScanQRDetails",
      params: { raw: result.data, role, name, email },
    });

    setTimeout(() => {
      setScanned(false);
      setCameraKey((prev) => prev + 1);
    }, 500);
  };

  // ---------- EARLY RETURNS AFTER ALL HOOKS ----------

  // Auth is loading
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <LinearGradient
          colors={["#2563EB", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1 items-center justify-center"
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text className="mt-3 text-xs text-white/80">
            Loading scanner…
          </Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Not logged in → already redirected by useRequireAuth
  if (!user) return null;

  // Owner/Employee blocked (verification pending)
  if (ownerBlocked || employeeBlocked) {
    const isOwner = role === "OWNER";

    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <LinearGradient
          colors={["#2563EB", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View className="flex-row items-center justify-between px-4 py-3">
            {isOwner ? (
              <TouchableOpacity onPress={() => router.replace("/Home")}>
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 24 }} />
            )}

            <Text className="text-base font-semibold text-white">
              Scan QR
            </Text>

            {isOwner ? (
              <View style={{ width: 24 }} />
            ) : (
              <TouchableOpacity onPress={handleLogout}>
                <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full p-4 bg-white border rounded-3xl shadow-md border-sky-100">
            <Text className="mb-2 text-lg font-semibold text-slate-900">
              QR Locked
            </Text>

            {isOwner ? (
              <Text className="text-sm text-slate-600">
                Your profile is not verified. Scan feature will be enabled after admin verification.
              </Text>
            ) : (
              <Text className="text-sm text-slate-600">
                Your Owner’s profile is not verified. Scan feature will be enabled after verification.
              </Text>
            )}
          </View>
        </View>

        <AppBottomNav
          active="qr"
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
    );
  }

  // USER role (not owner/employee)
  if (!isScanAllowed) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <LinearGradient
          colors={["#2563EB", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-4 py-3"
        >
          <View className="flex-row items-center justify-between">
            <View style={{ width: 24 }} />
            <Text className="text-white text-base font-semibold">
              Scan any QR
            </Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full p-4 bg-white/95 border rounded-3xl shadow-md border-sky-100">
            <Text className="mb-2 text-lg font-semibold text-slate-900">
              Scan not available
            </Text>
            <Text className="text-sm text-slate-600">
              Only shop owners and employees can scan QR codes.
            </Text>
          </View>
        </View>

        <AppBottomNav
          active="qr"
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
    );
  }

  // ---------- RENDER MAIN SCAN UI ----------
  const renderScan = () => {
    if (hasPermission === null) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563EB" />
          <Text className="mt-2 text-xs text-slate-300">
            Requesting permission...
          </Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full p-4 bg-white border rounded-3xl shadow-md">
            <Text className="text-sm text-center text-slate-700">
              Camera permission denied. Enable it in settings.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View className="flex-1">
        <CameraView
          key={cameraKey}
          style={{ flex: 1 }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          enableTorch={flashOn}
        />

        <View style={styles.overlay} />
        <View style={styles.overlayContainer}>
          <View style={styles.scanBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <View style={styles.flashContainer}>
          <TouchableOpacity
            onPress={() => setFlashOn((p) => !p)}
            style={styles.flashButton}
          >
            <Ionicons
              name={flashOn ? "flash" : "flash-outline"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <LinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 py-3"
      >
        <View className="flex-row items-center justify-between">
          {role === "OWNER" ? (
            <TouchableOpacity onPress={() => router.replace("/Home")}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 22 }} />
          )}

          <Text className="text-white text-center font-semibold flex-1">
            Scan any QR
          </Text>

          <View style={{ width: 22 }} />
        </View>
      </LinearGradient>

      {renderScan()}

      <AppBottomNav
        active="qr"
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
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBox: {
    width: 260,
    height: 260,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  corner: {
    position: "absolute",
    width: 42,
    height: 42,
    borderWidth: 4,
    borderColor: "#EC4899",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopLeftRadius: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopRightRadius: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: 20,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomRightRadius: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  flashContainer: {
    position: "absolute",
    right: 24,
    bottom: 120,
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
});
