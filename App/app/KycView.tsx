// app/KycView.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth } from "./context/AuthContext";

type Role = "OWNER" | "EMPLOYEE" | "USER";
type KycStatus = "PENDING" | "APPROVED" | "REJECTED";

interface KycData {
  status: KycStatus;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  aadhaarPdfUrl?: string;
  gstCertUrl?: string;
  udyamCertUrl?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function KycView() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState<KycData | null>(null);

  if (!user || !token) {
    router.replace("/Login");
    return null;
  }

  const role = (user.role as Role) || "USER";
  const profilePercent = user.profilePercent ?? 0;
  const isVerified = !!user.isProfileVerified;
  const qrCodeUrl = (user as any)?.qrCodeUrl;
  const shopCompleted = !!(user as any)?.shopCompleted;

  // -------- Fetch KYC details --------
  useEffect(() => {
    const fetchKyc = async () => {
      try {
        const res = await fetch(`${baseURL}${SummaryApi.kyc_me.url}`, {
          method: SummaryApi.kyc_me.method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok || !data.success || !data.data) {
          setKyc(null);
        } else {
          const k = data.data;
          setKyc({
            status: (k.status as KycStatus) || "PENDING",
            aadhaarFrontUrl: k.aadhaarFrontUrl,
            aadhaarBackUrl: k.aadhaarBackUrl,
            aadhaarPdfUrl: k.aadhaarPdfUrl,
            gstCertUrl: k.gstCertUrl,
            udyamCertUrl: k.udyamCertUrl,
            remarks: k.remarks,
            createdAt: k.createdAt,
            updatedAt: k.updatedAt,
          });
        }
      } catch (err) {
        console.log("Get KYC error:", err);
        setKyc(null);
      } finally {
        setLoading(false);
      }
    };

    fetchKyc();
  }, [user._id, token]);

  const openDoc = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => {
      console.log("Open doc error:", err);
      Alert.alert("Error", "Unable to open document.");
    });
  };

  // Detect file type (treat Cloudinary /raw URLs as PDF)
  const getFileTypeLabel = (url?: string) => {
    if (!url) return "";
    const lower = url.toLowerCase();

    const looksLikePdf =
      lower.includes(".pdf") || lower.includes("/raw/upload/");

    if (looksLikePdf) return "PDF file";
    if (lower.match(/\.(jpg|jpeg|png|webp|heic)/)) return "Image (JPG / PNG)";
    return "Document";
  };

  const statusConfig = (() => {
    switch (kyc?.status) {
      case "APPROVED":
        return {
          label: "Approved",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          chipBg: "bg-emerald-100",
          chipText: "text-emerald-800",
          dot: "bg-emerald-500",
        };
      case "PENDING":
        return {
          label: "Pending",
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          chipBg: "bg-amber-100",
          chipText: "text-amber-800",
          dot: "bg-amber-500",
        };
      case "REJECTED":
        return {
          label: "Rejected",
          bg: "bg-rose-50",
          border: "border-rose-200",
          text: "text-rose-700",
          chipBg: "bg-rose-100",
          chipText: "text-rose-800",
          dot: "bg-rose-500",
        };
      default:
        return {
          label: "No KYC",
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          chipBg: "bg-blue-100",
          chipText: "text-blue-800",
          dot: "bg-blue-500",
        };
    }
  })();

  /* 🔹 UPDATED: renderDocTile → different button for PDF vs Image */
  const renderDocTile = (title: string, url?: string) => {
    if (!url) {
      return (
        <View className="mb-3 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-3 py-3">
          <Text className="text-[11px] font-semibold text-slate-500">
            {title}
          </Text>
          <Text className="mt-1 text-[11px] text-slate-400">Not uploaded</Text>
        </View>
      );
    }

    const lower = url.toLowerCase();
    const isPdf = lower.includes(".pdf") || lower.includes("/raw/upload/");
    const isImage = !isPdf;
    const fileType = getFileTypeLabel(url);

    const buttonLabel = isPdf ? "Download" : "View";
    const buttonIcon = isPdf ? "download-outline" : "eye-outline";

    return (
      <View className="mb-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-[11px] font-semibold text-slate-900">
              {title}
            </Text>
            <Text className="mt-1 text-[10px] text-slate-500">
              {fileType}
            </Text>
            {isPdf && (
              <Text className="mt-0.5 text-[9px] text-slate-400">
                Opens in browser to view / download.
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => openDoc(url)}
            className="flex-row items-center rounded-full bg-slate-900 px-3 py-1.5"
          >
            <Ionicons
              name={buttonIcon as any}
              size={14}
              color="#F9FAFB"
              style={{ marginRight: 4 }}
            />
            <Text className="text-[11px] font-semibold text-slate-50">
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {isImage && (
          <View className="h-28 w-full overflow-hidden rounded-xl bg-slate-100">
            <Image
              source={{ uri: url }}
              className="h-full w-full"
              resizeMode="cover"
            />
          </View>
        )}
      </View>
    );
  };

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

  if (!kyc) {
    router.replace("/UploadKyc");
    return null;
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
        <View className="rounded-b-3xl bg-white px-5 pt-4 pb-5 shadow-md shadow-slate-900/20">
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
                  KYC details
                </Text>
                <Text className="text-[11px] text-slate-500">
                  View uploaded Aadhaar, GST &amp; Udyam documents
                </Text>
              </View>
            </View>

            <View
              className={`ml-2 rounded-full px-3 py-1 flex-row items-center justify-center ${statusConfig.chipBg}`}
            >
              <View
                className={`mr-1.5 h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
              />
              <Text
                className={`text-[10px] font-semibold ${statusConfig.chipText}`}
              >
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 260,
          }}
        >
          {/* Status card */}
          <View className="mb-4 rounded-3xl px-4 py-4 bg-white shadow-[0px_6px_16px_rgba(15,23,42,0.25)]">
            <Text className="text-[11px] font-semibold text-slate-500 mb-1">
              KYC STATUS
            </Text>
            <Text className={`text-xs font-semibold ${statusConfig.text}`}>
              {statusConfig.label}
            </Text>
            {kyc.remarks && (
              <Text className="mt-2 text-[11px] text-rose-600">
                Remarks: {kyc.remarks}
              </Text>
            )}
            {kyc.updatedAt && (
              <Text className="mt-1 text-[10px] text-slate-500">
                Last updated: {new Date(kyc.updatedAt).toLocaleString()}
              </Text>
            )}
          </View>

          {/* Aadhaar section */}
          <View className="mb-4 rounded-3xl bg-white/95 px-4 py-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold text-slate-900">
                Aadhaar documents
              </Text>
            </View>

            {renderDocTile("Aadhaar – Front side", kyc.aadhaarFrontUrl)}
            {renderDocTile("Aadhaar – Back side", kyc.aadhaarBackUrl)}
            {renderDocTile("Aadhaar – PDF", kyc.aadhaarPdfUrl)}
          </View>

          {/* Business docs section */}
          <View className="mb-6 rounded-3xl bg-white/95 px-4 py-4">
            <Text className="mb-2 text-xs font-semibold text-slate-900">
              Business documents
            </Text>

            {renderDocTile("GST Certificate", kyc.gstCertUrl)}
            {renderDocTile("Udyam Certificate", kyc.udyamCertUrl)}
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
  