// app/UploadKyc.tsx
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
type AadhaarMode = "IMAGE" | "PDF";

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
};

type ExistingKyc = {
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  aadhaarPdfUrl?: string;
  gstCertUrl?: string;
  udyamCertUrl?: string;
  status?: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
};

const IMG_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const PDF_TYPES = ["application/pdf"];
const ALL_TYPES = [...IMG_TYPES, ...PDF_TYPES];

export default function UploadKyc() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [aadhaarMode, setAadhaarMode] = useState<AadhaarMode>("IMAGE");

  const [aadhaarFront, setAadhaarFront] = useState<PickedFile | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<PickedFile | null>(null);
  const [aadhaarPdf, setAadhaarPdf] = useState<PickedFile | null>(null);

  const [gstCert, setGstCert] = useState<PickedFile | null>(null);
  const [udyamCert, setUdyamCert] = useState<PickedFile | null>(null);

  const [kycStatus, setKycStatus] = useState<
    "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED"
  >("NOT_SUBMITTED");

  const [existingKyc, setExistingKyc] = useState<ExistingKyc | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const ownerId = user?._id;

  /* ---------------------- redirect if not logged in (no conditional hooks) ---------------------- */
  useEffect(() => {
    if (!user || !token) {
      router.replace("/Login");
    }
  }, [user, token, router]);

  /* ---------------------- Load existing KYC ---------------------- */
  useEffect(() => {
    if (!ownerId || !token) {
      setLoading(false);
      return;
    }

    const fetchKyc = async () => {
      try {
        const res = await fetch(`${baseURL}${SummaryApi.kyc_me.url}`, {
          method: SummaryApi.kyc_me.method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.success && data.data) {
          const kyc = data.data as ExistingKyc;

          setExistingKyc(kyc);

          const status =
            (kyc.status as
              | "NOT_SUBMITTED"
              | "PENDING"
              | "APPROVED"
              | "REJECTED") || "PENDING";

          setKycStatus(status);

          // Decide default Aadhaar mode based on stored URLs
          if (kyc.aadhaarPdfUrl) {
            setAadhaarMode("PDF");
          } else {
            setAadhaarMode("IMAGE");
          }
        } else {
          setExistingKyc(null);
          setKycStatus("NOT_SUBMITTED");
        }
      } catch (err) {
        console.log("Fetch KYC error:", err);
        setExistingKyc(null);
        setKycStatus("NOT_SUBMITTED");
      } finally {
        setLoading(false);
      }
    };

    fetchKyc();
  }, [ownerId, token]);

  /* ---------------------- Pickers: files ---------------------- */
  const pickImageOnly = async (setter: (f: PickedFile | null) => void) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      const file = res.assets[0];
      const mimeType = file.mimeType || "application/octet-stream";

      if (!IMG_TYPES.includes(mimeType)) {
        Alert.alert("Invalid file", "Only JPG / PNG images are allowed.");
        return;
      }

      setter({
        uri: file.uri,
        name: file.name || "image",
        mimeType,
      });
    } catch (err) {
      console.log("Image picker error:", err);
      Alert.alert("Error", "Could not select image.");
    }
  };

  const pickPdfOnly = async (setter: (f: PickedFile | null) => void) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf"],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      const file = res.assets[0];
      const mimeType = file.mimeType || "application/octet-stream";

      if (!PDF_TYPES.includes(mimeType)) {
        Alert.alert("Invalid file", "Only PDF file is allowed.");
        return;
      }

      setter({
        uri: file.uri,
        name: file.name || "document.pdf",
        mimeType,
      });
    } catch (err) {
      console.log("PDF picker error:", err);
      Alert.alert("Error", "Could not select PDF.");
    }
  };

  const pickAny = async (setter: (f: PickedFile | null) => void) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      const file = res.assets[0];
      const mimeType = file.mimeType || "application/octet-stream";

      if (!ALL_TYPES.includes(mimeType)) {
        Alert.alert("Invalid file", "Only JPG, PNG or PDF files are allowed.");
        return;
      }

      setter({
        uri: file.uri,
        name: file.name || "document",
        mimeType,
      });
    } catch (err) {
      console.log("Document picker error:", err);
      Alert.alert("Error", "Could not select file.");
    }
  };

  /* ---------------------- Pickers: camera ---------------------- */
  const pickImageFromCamera = async (
    setter: (f: PickedFile | null) => void
  ) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Camera permission is needed to take a photo."
        );
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (res.canceled) return;

      const asset = res.assets[0];
      const uri = asset.uri;
      const name = asset.fileName || "camera-image.jpg";
      const mimeType = "image/jpeg";

      setter({
        uri,
        name,
        mimeType,
      });
    } catch (err) {
      console.log("Camera picker error:", err);
      Alert.alert("Error", "Could not open camera.");
    }
  };

  /* ---------------------- Existing docs (from DB) ---------------------- */
  const hasExistingAadhaarFront = !!existingKyc?.aadhaarFrontUrl;
  const hasExistingAadhaarBack = !!existingKyc?.aadhaarBackUrl;
  const hasExistingAadhaarPdf = !!existingKyc?.aadhaarPdfUrl;
  const hasExistingGst = !!(existingKyc?.gstCertUrl || "").trim();
  const hasExistingUdyam = !!(existingKyc?.udyamCertUrl || "").trim();

  // Extra helpers: used to LOCK the Aadhaar mode
  const hasExistingAadhaarImages =
    hasExistingAadhaarFront && hasExistingAadhaarBack;

  const aadhaarLockedToImage =
    hasExistingAadhaarImages && !hasExistingAadhaarPdf;
  const aadhaarLockedToPdf =
    hasExistingAadhaarPdf && !hasExistingAadhaarImages;

  // If locked, force mode to correct value
  useEffect(() => {
    if (aadhaarLockedToImage && aadhaarMode !== "IMAGE") {
      setAadhaarMode("IMAGE");
    } else if (aadhaarLockedToPdf && aadhaarMode !== "PDF") {
      setAadhaarMode("PDF");
    }
  }, [aadhaarLockedToImage, aadhaarLockedToPdf, aadhaarMode]);

  /* ---------------------- Required check ---------------------- */
  const aadhaarOk =
    aadhaarMode === "IMAGE"
      ? (!!aadhaarFront && !!aadhaarBack) ||
        (hasExistingAadhaarFront && hasExistingAadhaarBack)
      : !!aadhaarPdf || hasExistingAadhaarPdf;

  // Only Aadhaar is mandatory (GST & Udyam are optional)
  const allRequiredSelected = aadhaarOk;

  /* ---------------------- Submit ---------------------- */
  const handleSubmit = async () => {
    if (!allRequiredSelected) {
      Alert.alert(
        "Missing documents",
        "Please upload Aadhaar (PDF or both front & back photos)."
      );
      return;
    }

    try {
      setSaving(true);

      const form = new FormData();

      // Aadhaar: only append if user re-uploads in this request
      if (aadhaarMode === "IMAGE") {
        if (aadhaarFront) {
          form.append("aadhaarFront", {
            uri: aadhaarFront.uri,
            name: aadhaarFront.name,
            type: aadhaarFront.mimeType,
          } as any);
        }
        if (aadhaarBack) {
          form.append("aadhaarBack", {
            uri: aadhaarBack.uri,
            name: aadhaarBack.name,
            type: aadhaarBack.mimeType,
          } as any);
        }
      } else {
        if (aadhaarPdf) {
          form.append("aadhaarPdf", {
            uri: aadhaarPdf.uri,
            name: aadhaarPdf.name,
            type: aadhaarPdf.mimeType,
          } as any);
        }
      }

      // GST / Udyam optional, only sent when re-uploaded
      if (gstCert) {
        form.append("gstCert", {
          uri: gstCert.uri,
          name: gstCert.name,
          type: gstCert.mimeType,
        } as any);
      }
      if (udyamCert) {
        form.append("udyamCert", {
          uri: udyamCert.uri,
          name: udyamCert.name,
          type: udyamCert.mimeType,
        } as any);
      }

      const res = await fetch(`${baseURL}${SummaryApi.kyc_upload.url}`, {
        method: SummaryApi.kyc_upload.method,
        headers: {
          Authorization: `Bearer ${token}`,
        } as any,
        body: form,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to upload KYC.");
        return;
      }

      setKycStatus("PENDING");

      Alert.alert(
        "KYC submitted",
        "Your KYC documents have been uploaded successfully.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/Profile"),
          },
        ]
      );
    } catch (err) {
      console.log("KYC upload error:", err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------- UI helper: document row ---------------------- */
  const renderDocRow = (
    title: string,
    description: string,
    file: PickedFile | null,
    onPickFile: () => void,
    onPickCamera?: () => void,
    hasExisting?: boolean
  ) => {
    const hasNewFile = !!file;
    const selected = hasNewFile || !!hasExisting;

    let infoLabel = "No file selected";
    if (hasNewFile) {
      infoLabel = file!.name;
    } else if (hasExisting) {
      infoLabel = "Already uploaded";
    }

    // If APPROVED → lock field (no changes)
    // Otherwise: if already uploaded and no new file → lock buttons
    const showButtons =
      kycStatus !== "APPROVED" && (!hasExisting || hasNewFile);

    return (
      <View className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="mr-2 flex-1">
            <Text className="text-xs font-semibold text-slate-900">
              {title}
            </Text>
            <Text className="mt-1 text-[11px] text-slate-500">
              {description}
            </Text>
          </View>

          {/* Green tick */}
          <View
            className={`h-6 w-6 items-center justify-center rounded-full ${
              selected ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <Ionicons
              name="checkmark"
              size={14}
              color={selected ? "#ECFDF5" : "#F9FAFB"}
            />
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="mr-2 flex-1">
            <Text
              className={`text-[11px] ${
                selected ? "text-slate-700" : "text-slate-400"
              }`}
              numberOfLines={1}
            >
              {infoLabel}
            </Text>
          </View>

          {showButtons && (
            <View className="flex-row items-center">
              {onPickCamera && (
                <TouchableOpacity
                  onPress={onPickCamera}
                  className="mr-2 rounded-full border border-blue-600 px-3 py-1.5"
                >
                  <Text className="text-[11px] font-semibold text-blue-600">
                    Camera
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onPickFile}
                className="rounded-full bg-blue-600 px-3 py-1.5"
              >
                <Text className="text-[11px] font-semibold text-blue-50">
                  {hasNewFile
                    ? "Change file"
                    : hasExisting
                    ? "Replace file"
                    : "Upload file"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  /* ---------------------- while redirecting / logged out ---------------------- */
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

  /* ---------------------- Loading state ---------------------- */
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

  const role = (user.role as Role) || "USER";
  const profilePercent = user.profilePercent ?? 0;
  const isVerified = !!(user as any)?.isProfileVerified;
  const qrCodeUrl = (user as any)?.qrCodeUrl;
  const shopCompleted = !!(user as any)?.shopCompleted;

  /* ---------------------- Screen UI ---------------------- */
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
                  Upload KYC documents
                </Text>
                <Text className="text-[11px] text-slate-500">
                  Aadhaar mandatory. GST / Udyam optional.
                </Text>
              </View>
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
          {/* Info banner */}
          <View className="mb-4 flex-row items-center rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3">
            <View className="mr-3 rounded-full bg-blue-100 p-2">
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#1D4ED8"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-900">
                KYC rules
              </Text>
              <Text className="mt-1 text-[11px] text-slate-600">
                Aadhaar is mandatory (PDF or photos). GST and Udyam are
                optional – upload them if available for your business records.
              </Text>
            </View>
          </View>

          {/* Aadhaar mode toggle */}
          <View className="mb-3 rounded-2xl bg-white/90 px-3 py-3 border border-blue-100">
            <Text className="mb-2 text-[11px] font-semibold text-slate-700">
              Aadhaar upload type
            </Text>

            <View className="flex-row bg-slate-100 rounded-full p-1">
              {/* Photos tab – hidden if Aadhaar locked to PDF */}
              {!aadhaarLockedToPdf && (
                <TouchableOpacity
                  onPress={() => setAadhaarMode("IMAGE")}
                  className={`flex-1 h-8 items-center justify-center rounded-full ${
                    aadhaarMode === "IMAGE"
                      ? "bg-blue-600"
                      : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${
                      aadhaarMode === "IMAGE"
                        ? "text-blue-50"
                        : "text-slate-600"
                    }`}
                  >
                    Photos (front + back)
                  </Text>
                </TouchableOpacity>
              )}

              {/* Single PDF tab – hidden if Aadhaar locked to Images */}
              {!aadhaarLockedToImage && (
                <TouchableOpacity
                  onPress={() => setAadhaarMode("PDF")}
                  className={`flex-1 h-8 items-center justify-center rounded-full ${
                    aadhaarMode === "PDF" ? "bg-blue-600" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${
                      aadhaarMode === "PDF"
                        ? "text-blue-50"
                        : "text-slate-600"
                    }`}
                  >
                    Single PDF
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {(aadhaarLockedToImage || aadhaarLockedToPdf) && (
              <Text className="mt-1 text-[10px] text-emerald-700">
                Aadhaar already uploaded. To change document type, please
                contact the association admin.
              </Text>
            )}
          </View>

          {/* Aadhaar rows */}
          {aadhaarMode === "IMAGE" ? (
            <>
              {renderDocRow(
                "Aadhaar – Front side",
                "Owner Aadhaar front – JPG / PNG",
                aadhaarFront,
                () => pickImageOnly(setAadhaarFront),
                () => pickImageFromCamera(setAadhaarFront),
                hasExistingAadhaarFront
              )}
              {renderDocRow(
                "Aadhaar – Back side",
                "Owner Aadhaar back – JPG / PNG",
                aadhaarBack,
                () => pickImageOnly(setAadhaarBack),
                () => pickImageFromCamera(setAadhaarBack),
                hasExistingAadhaarBack
              )}
            </>
          ) : (
            renderDocRow(
              "Aadhaar – PDF",
              "Aadhaar card (front & back) combined in a single PDF",
              aadhaarPdf,
              () => pickPdfOnly(setAadhaarPdf),
              undefined,
              hasExistingAadhaarPdf
            )
          )}

          {/* GST + Udyam (optional) */}
          {renderDocRow(
            "GST Certificate (optional)",
            "GST registration certificate – JPG / PNG / PDF",
            gstCert,
            () => pickAny(setGstCert),
            () => pickImageFromCamera(setGstCert),
            hasExistingGst
          )}

          {renderDocRow(
            "Udyam Certificate (optional)",
            "MSME / Udyam registration certificate – JPG / PNG / PDF",
            udyamCert,
            () => pickAny(setUdyamCert),
            () => pickImageFromCamera(setUdyamCert),
            hasExistingUdyam
          )}

          {/* Submit / View button */}
          <View className="mt-4">
            {/* DO NOT SHOW ANY BUTTON IF APPROVED */}
            {kycStatus !== "APPROVED" && (
              <TouchableOpacity
                disabled={!allRequiredSelected || saving}
                onPress={handleSubmit}
                className={`h-12 w-full items-center justify-center rounded-full shadow-lg shadow-blue-300/60 ${
                  !allRequiredSelected || saving
                    ? "bg-blue-400/60"
                    : "bg-blue-600"
                }`}
              >
                {saving ? (
                  <ActivityIndicator color="#E0F2FE" />
                ) : (
                  <Text className="text-sm font-semibold text-blue-50">
                    {kycStatus === "NOT_SUBMITTED"
                      ? "Submit KYC documents"
                      : "Update KYC documents"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
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
