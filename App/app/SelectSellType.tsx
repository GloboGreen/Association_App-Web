import React from "react";
import { Image, Pressable, SafeAreaView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const sparePartsImg = require("../assets/sell/mobile-spare-parts.png");

/* ---------- GREEN THEME ---------- */
const GREEN_PRIMARY = "#006400";
const GREEN_SOFT = "#F0FFF0";
const GREEN_LIGHT = "#D1FAE5";
const GREEN_TEXT = "#064E3B";
/* -------------------------------- */

export default function SelectSellType() {
  const router = useRouter();

  const {
    brandId,
    brandName,
    seriesId,
    seriesName,
    modelId,
    modelName,
    modelImage,
  } = useLocalSearchParams<{
    brandId: string;
    brandName: string;
    seriesId: string;
    seriesName: string;
    modelId: string;
    modelName: string;
    modelImage: string;
  }>();

  const safeBrandId = String(brandId ?? "");
  const safeBrandName = String(brandName ?? "");
  const safeSeriesId = String(seriesId ?? "");
  const safeSeriesName = String(seriesName ?? "");
  const safeModelId = String(modelId ?? "");
  const safeModelName = String(modelName ?? "");
  const safeModelImage = String(modelImage ?? "");

  function goMobileSell() {
    router.push({
      pathname: "/Questions",
      params: {
        brandId: safeBrandId,
        brandName: safeBrandName,
        seriesId: safeSeriesId,
        seriesName: safeSeriesName,
        modelId: safeModelId,
        modelName: safeModelName,
      },
    });
  }

  function goSparePartsSell() {
    router.push({
      pathname: "/SpareParts",
      params: {
        brandId: safeBrandId,
        brandName: safeBrandName,
        modelId: safeModelId,
        modelName: safeModelName,
      },
    });
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: GREEN_SOFT }}>
      <View className="flex-1 px-5 pt-4">
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm"
          >
            <Ionicons name="chevron-back" size={22} color={GREEN_TEXT} />
          </Pressable>

          <Text
            className="text-[17px] font-extrabold"
            style={{ color: GREEN_TEXT }}
          >
            Choose Sell Type
          </Text>

          <View className="w-11" />
        </View>

        {/* Selected Model */}
        <View
          className="mb-6 rounded-3xl p-5"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: GREEN_LIGHT,
            borderWidth: 1,
          }}
        >
          <Text className="text-[12px] font-semibold uppercase text-green-700">
            Selected Model
          </Text>

          <Text
            className="mt-1 text-[16px] font-extrabold"
            style={{ color: GREEN_TEXT }}
          >
            {safeBrandName} {safeModelName}
          </Text>
        </View>

        {/* Options */}
        <View className="flex-row justify-between">
          {/* Mobile Card */}
          <Pressable
            onPress={goMobileSell}
            className="w-[48%] rounded-[28px] bg-white p-4"
            style={{
              borderColor: GREEN_LIGHT,
              borderWidth: 1,
            }}
          >
            <View className="h-[140px] items-center justify-center rounded-2xl">
              {safeModelImage ? (
                <Image
                  source={{ uri: safeModelImage }}
                  className="h-[130px] w-[130px]"
                  resizeMode="contain"
                />
              ) : (
                <Ionicons
                  name="phone-portrait-outline"
                  size={36}
                  color={GREEN_PRIMARY}
                />
              )}
            </View>

            <Text
              className="mt-4 text-center text-[16px] font-extrabold"
              style={{ color: GREEN_TEXT }}
            >
              Mobile
            </Text>

            <Text className="mt-1 text-center text-[12px] font-semibold text-green-700">
              Complete phone resale
            </Text>
          </Pressable>

          {/* Spare Parts Card */}
          <Pressable
            onPress={goSparePartsSell}
            className="w-[48%] rounded-[28px] bg-white p-4"
            style={{
              borderColor: GREEN_LIGHT,
              borderWidth: 1,
            }}
          >
            <View className="h-[140px] items-center justify-center rounded-2xl">
              <Image
                source={sparePartsImg}
                className="h-[120px] w-[120px]"
                resizeMode="contain"
              />
            </View>

            <Text
              className="mt-4 text-center text-[16px] font-extrabold"
              style={{ color: GREEN_TEXT }}
            >
              Spare Parts
            </Text>

            <Text className="mt-1 text-center text-[12px] font-semibold text-green-700">
              Parts & accessories
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
