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
  useWindowDimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";

import SummaryApi, { baseURL } from "../constants/SummaryApi";

type Series = {
  _id: string;
  name: string;
  status?: "Active" | "Inactive";
  isAll?: boolean;
};

type Model = {
  _id: string;
  name: string;
  imageUrl?: string;
  image?: string;
  status?: "Active" | "Inactive";
};

const ALL_SERIES: Series = { _id: "ALL", name: "All Series", isAll: true };

export default function SelectModel() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { brandId, brandName, brandImage } = useLocalSearchParams<{
    brandId: string;
    brandName: string;
    brandImage: string;
  }>();

  const safeBrandId = String(brandId ?? "");
  const safeBrandName = String(brandName ?? "");
  const safeBrandImage = String(brandImage ?? "");

  const [search, setSearch] = useState("");
  const [series, setSeries] = useState<Series[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  const [loadingSeries, setLoadingSeries] = useState(true);
  const [loadingModels, setLoadingModels] = useState(true);

  /* ✅ Perfect 3-column grid */
  const GAP = 12;
  const ITEM_WIDTH = Math.floor((width - 32 - GAP * 2) / 3);

  /* ===================== API ===================== */

  async function fetchSeries() {
    try {
      setLoadingSeries(true);

      const res = await axios.request({
        baseURL,
        method: SummaryApi.get_series.method,
        url: SummaryApi.get_series.url,
        params: { brandId: safeBrandId },
      });

      const list: Series[] = res.data?.series ?? res.data?.data ?? [];
      const active = list.filter((s) => s.status !== "Inactive");

      setSeries([ALL_SERIES, ...active]);
      setSelectedSeries(null); // default → All Series
    } catch (e) {
      setSeries([ALL_SERIES]);
      setSelectedSeries(null);
    } finally {
      setLoadingSeries(false);
    }
  }

  async function fetchModelsBySeries(seriesId: string) {
    const res = await axios.request({
      baseURL,
      method: SummaryApi.get_models.method,
      url: SummaryApi.get_models.url,
      params: { seriesId },
    });

    const list: Model[] = res.data?.models ?? res.data?.data ?? [];
    return list.filter((m) => m.status !== "Inactive");
  }

  async function fetchAllModels(seriesList: Series[]) {
    const realSeries = seriesList.filter((s) => !s.isAll);

    const results = await Promise.allSettled(
      realSeries.map((s) => fetchModelsBySeries(s._id))
    );

    const merged: Model[] = [];
    const seen = new Set<string>();

    results.forEach((r) => {
      if (r.status === "fulfilled") {
        r.value.forEach((m) => {
          if (!seen.has(m._id)) {
            seen.add(m._id);
            merged.push(m);
          }
        });
      }
    });

    setModels(merged);
  }

  async function loadModels() {
    try {
      setLoadingModels(true);

      if (!selectedSeries) {
        await fetchAllModels(series);
        return;
      }

      const list = await fetchModelsBySeries(selectedSeries._id);
      setModels(list);
    } catch (e) {
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }

  /* ===================== EFFECTS ===================== */

  useEffect(() => {
    if (safeBrandId) fetchSeries();
  }, [safeBrandId]);

  useEffect(() => {
    if (series.length) loadModels();
  }, [selectedSeries, series.length]);

  /* ===================== FILTER ===================== */

  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.name.toLowerCase().includes(q));
  }, [search, models]);

  /* ===================== UI ===================== */

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4 pt-3">
        {/* Header */}
        <View className="mb-4 flex-row items-center justify-between mt-10">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100"
          >
            <Ionicons name="chevron-back" size={22} />
          </Pressable>

          <View className="items-center">
            <Text className="text-[16px] font-extrabold">Select Product</Text>
            <Text className="text-[11px] text-gray-400 font-semibold">
              {safeBrandName}
            </Text>
          </View>

          <View className="h-11 w-11" />
        </View>

        {/* Search */}
        <View className="mb-4 flex-row items-center rounded-2xl border border-green-200 px-4 py-1">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search model name"
            className="ml-3 flex-1 text-[13px] font-semibold"
          />
        </View>

        {/* ✅ SELECT SERIES (NO MODAL) */}
        <View className="mb-4">
          <Text className="mb-4 text-[14px] font-extrabold text-gray-900">
            Select Series
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {series.map((item) => {
              const active =
                (!selectedSeries && item.isAll) ||
                selectedSeries?._id === item._id;

              return (
                <Pressable
                  key={item._id}
                  onPress={() =>
                    setSelectedSeries(item.isAll ? null : item)
                  }
                  className="h-12 w-[31%] items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: active ? "#006400" : "#F0FFF0",
                  }}
                >
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: active ? "#fff" : "#111827" }}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Models */}
        {loadingSeries || loadingModels ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            data={filteredModels}
            keyExtractor={(item) => item._id}
            numColumns={3}
            columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
            renderItem={({ item }) => {
              const img = item.imageUrl || item.image || "";

              return (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/SelectSellType",
                      params: {
                        brandId: safeBrandId,
                        brandName: safeBrandName,
                        modelId: item._id,
                        modelName: item.name,
                        modelImage: img,
                      },
                    })
                  }
                  style={{
                    width: ITEM_WIDTH,
                    borderRadius: 20,
                    padding: 10,
                    borderWidth: 2,
                    borderColor: "#F0FFF0",
                  }}
                >
                  <View className="h-[100px] items-center justify-center">
                    {img ? (
                      <Image
                        source={{ uri: img }}
                        style={{ width: 90, height: 90 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons
                        name="phone-portrait-outline"
                        size={26}
                        color="#9CA3AF"
                      />
                    )}
                  </View>

                  <Text
                    numberOfLines={2}
                    className="mt-2 text-center text-[12px] font-extrabold"
                  >
                    {safeBrandName} {item.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
