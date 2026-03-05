import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import SummaryApi, { baseURL } from "../constants/SummaryApi";

/* ---------- THEME ---------- */
const BG = "#F8FAFC";
const CARD_BORDER = "#E5E7EB";
const TEXT_MAIN = "#111827";
const TEXT_SUB = "#6B7280";
const PRIMARY = "#111827";
/* --------------------------- */

type PartKey =
  | "screen_main"
  | "screen_outer"
  | "mainboard"
  | "battery"
  | "back_cover"
  | "camera"
  | "usb_cable"
  | "adapter";

type PartItem = {
  key: PartKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type UploadState = {
  localUri?: string;
  uploadedUrl?: string;
};

async function getAuthToken(): Promise<string> {
  return (await AsyncStorage.getItem("accessToken")) || "";
}

export default function SpareParts() {
  const router = useRouter();
  const { brandName, modelId, modelName } = useLocalSearchParams<{
    brandName: string;
    modelId: string;
    modelName: string;
  }>();

  const PARTS: PartItem[] = useMemo(
    () => [
      { key: "screen_main", title: "Screen", description: "Main screen", icon: "phone-portrait-outline" },
      { key: "screen_outer", title: "Outer Screen", description: "Glass damage", icon: "phone-portrait-outline" },
      { key: "mainboard", title: "Mainboard", description: "Logic board", icon: "hardware-chip-outline" },
      { key: "battery", title: "Battery", description: "Battery health", icon: "battery-half-outline" },
      { key: "back_cover", title: "Back Cover", description: "Rear panel", icon: "albums-outline" },
      { key: "camera", title: "Camera", description: "Camera module", icon: "camera-outline" },
      { key: "usb_cable", title: "USB Cable", description: "Charging cable", icon: "attach-outline" },
      { key: "adapter", title: "Adapter", description: "Power adapter", icon: "flash-outline" },
    ],
    []
  );

  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [loading, setLoading] = useState(false);

  function setOne(key: PartKey, patch: Partial<UploadState>) {
    setUploads((p) => ({ ...p, [key]: { ...(p[key] || {}), ...patch } }));
  }

  function openPicker(key: PartKey) {
    Alert.alert("Upload Image", "Choose source", [
      { text: "Camera", onPress: () => pickCamera(key) },
      { text: "Gallery", onPress: () => pickGallery(key) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function pickCamera(key: PartKey) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!res.canceled) upload(key, res.assets[0].uri);
  }

  async function pickGallery(key: PartKey) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!res.canceled) upload(key, res.assets[0].uri);
  }

  async function upload(key: PartKey, uri: string) {
    try {
      setLoading(true);
      setOne(key, { localUri: uri });

      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Login required");
        return;
      }

      const filename = uri.split("/").pop() || `upload-${Date.now()}.jpg`;

      const form = new FormData();
      form.append("modelId", String(modelId));
      form.append("partKey", key);
      form.append("image", {
        uri,
        name: filename,
        type: "image/jpeg",
      } as any);

      const res = await axios.request({
        baseURL,
        method: SummaryApi.spareparts_upload.method,
        url: SummaryApi.spareparts_upload.url,
        data: form,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const imageUrl = res.data?.data?.imageUrl;
      if (!imageUrl) throw new Error("Upload failed");

      setOne(key, { uploadedUrl: imageUrl });
    } catch (e: any) {
      console.log("❌ Upload error:", e?.response?.data || e.message);
      Alert.alert("Upload failed", "Please try again");
    } finally {
      setLoading(false);
    }
  }

  async function submitAll() {
    try {
      setLoading(true);
      const token = await getAuthToken();

      const items = PARTS.map((p) => ({
        partKey: p.key,
        title: p.title,
        description: p.description,
        imageUrl: uploads[p.key]?.uploadedUrl || "",
      }));

      await axios.request({
        baseURL,
        method: SummaryApi.spareparts_create.method,
        url: SummaryApi.spareparts_create.url,
        data: { modelId, items },
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert("Success", "Spare parts submitted");
      router.back();
    } catch {
      Alert.alert("Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BG }}>
      {/* HEADER */}
      <View className="px-4 pt-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
          >
            <Ionicons name="chevron-back" size={22} color={TEXT_MAIN} />
          </Pressable>

          <Text className="text-[16px] font-extrabold" style={{ color: TEXT_MAIN }}>
            Device Details
          </Text>

          <View className="w-10" />
        </View>

        <View className="rounded-xl bg-gray-100 p-3">
          <Text className="text-[12px] font-semibold text-gray-500">
            Selected Device
          </Text>
          <Text className="mt-0.5 text-[14px] font-extrabold text-gray-900">
            {brandName} {modelName}
          </Text>
        </View>
      </View>

      {/* GRID */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 mt-4 flex-row flex-wrap justify-between">
          {PARTS.map((p) => {
            const preview = uploads[p.key]?.uploadedUrl || uploads[p.key]?.localUri;

            return (
              <Pressable
                key={p.key}
                onPress={() => openPicker(p.key)}
                className="mb-4 w-[48%] rounded-2xl bg-white"
                style={{ borderWidth: 1, borderColor: CARD_BORDER }}
              >
                <View className="h-[120px] items-center justify-center rounded-t-2xl bg-gray-50">
                  {preview ? (
                    <Image
                      source={{ uri: preview }}
                      style={{ width: "90%", height: 100 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <>
                      <Ionicons name={p.icon} size={36} color="#9CA3AF" />
                      <Text className="mt-2 text-[11px] font-semibold text-gray-400">
                        Tap to upload
                      </Text>
                    </>
                  )}
                </View>

                <View className="px-3 py-3">
                  <Text className="text-[13px] font-extrabold text-gray-900">
                    {p.title}
                  </Text>
                  <Text className="mt-0.5 text-[11px] font-semibold text-gray-500">
                    {p.description}
                  </Text>

                  {uploads[p.key]?.uploadedUrl && (
                    <Text className="mt-2 text-[11px] font-semibold text-emerald-600">
                      Uploaded ✓
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* SUBMIT */}
        <View className="px-4">
          <Pressable
            onPress={submitAll}
            disabled={loading}
            className="mt-2 items-center justify-center rounded-2xl py-4"
            style={{ backgroundColor: PRIMARY }}
          >
            <Text className="text-[14px] font-extrabold text-white">
              {loading ? "Please wait..." : "Continue"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
