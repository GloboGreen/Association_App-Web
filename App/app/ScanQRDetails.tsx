// app/ScanQRDetails.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { baseURL } from "../constants/SummaryApi";
import { useAuth } from "./context/AuthContext";
import { ensureSecureAccess } from "../utils/security";

type ScanType = "BUY" | "RETURN";

export default function ScanQRDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, token: ctxToken } = useAuth();

  const raw = (params.raw as string) || "";
  const fallbackName = (params.name as string) || user?.name || "Member";

  const [scanType, setScanType] = useState<ScanType>("BUY");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  /** ---------- Parse QR JSON to get full name / shop ---------- */
  let qrName = fallbackName;
  let qrSubtitle = "Scanned QR ID";
  let qrMobile = "";
  let qrEmail = "";
  let qrVerified = false; // 👈 profile verified flag from QR

  try {
    if (raw) {
      const parsed = JSON.parse(raw);

      if (parsed?.name) qrName = parsed.name;
      if (parsed?.shopName) qrSubtitle = parsed.shopName;
      if (parsed?.mobile) qrMobile = parsed.mobile;
      if (parsed?.email) qrEmail = parsed.email;

      // expecting: isProfileVerified: true/false in QR JSON
      if (parsed?.isProfileVerified !== undefined) {
        qrVerified = Boolean(parsed.isProfileVerified);
      }
    }
  } catch (e) {
    // raw is not valid JSON → just ignore and use fallback
  }

  const submitScan = async () => {
    if (!raw) {
      Alert.alert("No QR", "QR value missing. Please scan again.");
      return;
    }

    try {
      setLoading(true);

      // 🔐 Ensure we send Authorization header (same as other APIs)
      let accessToken = ctxToken;
      if (!accessToken) {
        accessToken = (await AsyncStorage.getItem("accessToken")) || "";
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${baseURL}/api/qr/scan`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          raw,
          actionType: scanType,
          notes: notes.trim(),
        }),
      });

      const json = await res.json();
      console.log("QR scan response:", json);

      if (!res.ok || !json.success) {
        const msg =
          json?.message ||
          "Failed to save scan. Please login again or try later.";
        Alert.alert("QR Error", msg);
        return;
      }

      Alert.alert("Saved", json.message || "Scan saved. History updated.");

      // 🔁 EMPLOYEE → back to ScanQR, others → Home
      const role = user?.role || "OWNER";

      if (role === "EMPLOYEE") {
        router.replace({
          pathname: "/ScanQR",
          params: {
            role: "EMPLOYEE",
            name: user?.name || "",
            email: user?.mobile || "",
          },
        });
      } else {
        router.replace("/Home");
      }
    } catch (err) {
      console.log("scan save error:", err);
      Alert.alert("Error", "Something went wrong while saving scan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePress = async () => {
    // 🔐 Ask for fingerprint / face / PIN if App Lock is enabled
    const ok = await ensureSecureAccess("Unlock to save this scan");
    if (!ok) {
      // user cancelled / failed -> do nothing
      return;
    }

    // ✅ Proceed with existing scan saving logic
    await submitScan();
  };

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </TouchableOpacity>

          <Text className="text-white text-base font-semibold">
            Scan details
          </Text>

          <Ionicons name="help-circle-outline" size={20} color="#ffffff" />
        </View>

        <View className="flex-1 px-4 pt-2 pb-4">
          {/* White card with QR target info */}
          <View className="mb-4 rounded-2xl bg-white border border-zinc-200 p-4 shadow-md">
            <View className="flex-row items-center">
              {/* Avatar + verified / cancel badge */}
              <View className="relative">
                <View className="h-11 w-11 rounded-full bg-zinc-100 items-center justify-center">
                  <Text className="text-zinc-800 text-base font-semibold">
                    {qrName?.charAt(0)?.toUpperCase() || "M"}
                  </Text>
                </View>

                {/* Small badge bottom-right */}
                <View className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white items-center justify-center shadow">
                  {qrVerified ? (
                    // ✅ Verified: green checkmark
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#22c55e"
                    />
                  ) : (
                    // ❌ Not verified: red cancel
                    <Ionicons name="close-circle" size={18} color="#ef4444" />
                  )}
                </View>
              </View>

              {/* Name + info */}
              <View className="flex-1 ml-3">
                <Text
                  className="text-sm font-semibold text-zinc-900"
                  numberOfLines={2}
                >
                  {qrName}
                </Text>

                <Text
                  className="mt-0.5 text-[11px] text-zinc-500"
                  numberOfLines={1}
                >
                  {qrSubtitle}
                </Text>

                {qrMobile ? (
                  <Text className="mt-0.5 text-[11px] text-zinc-500">
                    {qrMobile}
                  </Text>
                ) : null}

                {qrEmail ? (
                  <Text
                    className="mt-0.5 text-[11px] text-zinc-500"
                    numberOfLines={1}
                  >
                    {qrEmail}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Scan type selection */}
          <Text className="mb-1 text-[11px] text-white/90">Select type</Text>
          <View className="flex-row mb-3 space-x-3">
            <TouchableOpacity
              onPress={() => setScanType("BUY")}
              className={`flex-1 h-10 items-center justify-center rounded-full border ${
                scanType === "BUY"
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-zinc-300"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  scanType === "BUY" ? "text-white" : "text-zinc-800"
                }`}
              >
                Buy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setScanType("RETURN")}
              className={`flex-1 h-10 items-center justify-center rounded-full border ${
                scanType === "RETURN"
                  ? "bg-pink-500 border-pink-500"
                  : "bg-white border-zinc-300"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  scanType === "RETURN" ? "text-white" : "text-zinc-800"
                }`}
              >
                Return
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notes input */}
          <Text className="mb-1 text-[11px] text-white/90">
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add item details, bill no, etc..."
            placeholderTextColor="#9ca3af"
            multiline
            className="h-24 rounded-2xl bg-white border border-zinc-300 text-xs text-zinc-900 p-3"
            style={{ textAlignVertical: "top" }}
          />

          {/* Spacer */}
          <View className="flex-1" />

          {/* Save Scan button */}
          <TouchableOpacity
            onPress={handleSavePress}
            disabled={loading}
            className="h-11 w-full overflow-hidden rounded-full mt-4"
          >
            <LinearGradient
              colors={["#EC4899", "#2563EB"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 1 }}
              className="flex-1 items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#EEF2FF" />
              ) : (
                <Text className="text-xs font-semibold text-white">
                  Save Scan
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
