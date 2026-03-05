import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";

import SummaryApi, { baseURL } from "../constants/SummaryApi";

/* ---------- GREEN THEME ---------- */
const GREEN_PRIMARY = "#006400";
const GREEN_SOFT = "#F0FFF0";
const GREEN_LIGHT = "#D1FAE5";
const GREEN_TEXT = "#064E3B";
/* -------------------------------- */

type Brand = {
  _id: string;
  name: string;
  image?: string;
  status?: "Active" | "Inactive";
};

export default function SelectBrand() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchBrands() {
    try {
      setLoading(true);

      const res = await axios.request({
        baseURL,
        method: SummaryApi.get_brands.method,
        url: SummaryApi.get_brands.url,
      });

      const list: Brand[] =
        res.data?.brands ?? res.data?.data ?? res.data ?? [];

      setBrands(list.filter((b) => b.status === "Active"));
    } catch (e: any) {
      console.log("❌ get_brands error:", e?.response?.data || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchBrands();
  }, []);

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [search, brands]);

  function onSelectBrand(brand: Brand) {
    router.push({
      pathname: "/SelectModel",
      params: {
        brandId: brand._id,
        brandName: brand.name,
        brandImage: brand.image ?? "",
      },
    });
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: GREEN_SOFT }}>
      <View className="flex-1 px-4 pt-14">
        {/* Header */}
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: GREEN_LIGHT }}
          >
            <Ionicons name="chevron-back" size={22} color={GREEN_TEXT} />
          </Pressable>

          <Text
            className="text-base font-extrabold"
            style={{ color: GREEN_TEXT }}
          >
            Select Brand
          </Text>
          <View className="w-9" />
        </View>

        {/* Search */}
        <View
          className="mb-4 flex-row items-center rounded-2xl px-4 py-2"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: GREEN_LIGHT,
            borderWidth: 1,
          }}
        >
          <Ionicons name="search" size={18} color={GREEN_PRIMARY} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search your brand..."
            placeholderTextColor="#6B7280"
            className="ml-2 flex-1 text-sm font-semibold"
            style={{ color: GREEN_TEXT }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={GREEN_PRIMARY} />
            </Pressable>
          )}
        </View>

        {/* Brand Grid */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={GREEN_PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={filteredBrands}
            keyExtractor={(item) => item._id}
            numColumns={3}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBrands();
            }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelectBrand(item)}
                className="mb-3 w-[31%] items-center rounded-2xl py-4"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: GREEN_LIGHT,
                  borderWidth: 1,
                }}
              >
                <View className="mb-2 h-14 w-14 items-center justify-center rounded-xl">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      className="h-[90px] w-[90px]"
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons
                      name="phone-portrait-outline"
                      size={26}
                      color={GREEN_PRIMARY}
                    />
                  )}
                </View>

                <Text
                  numberOfLines={1}
                  className="text-sm font-extrabold"
                  style={{ color: GREEN_TEXT }}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text className="text-sm font-semibold text-green-700">
                  No brands found
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
