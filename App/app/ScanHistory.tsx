// app/ScanHistory.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth } from "./context/AuthContext";

type Role = "OWNER" | "EMPLOYEE" | "USER";
type ActionType = "BUY" | "RETURN" | "UNKNOWN";
type DateFilter = "ALL" | "TODAY" | "LAST_7" | "LAST_30";

interface HistoryItem {
  id?: string;
  _id?: string;

  selfRole: "SENDER" | "RECEIVER" | string;

  myName: string;
  myShopName?: string;
  oppositeName: string;
  oppositeShopName?: string;

  fromName?: string;
  toName?: string;
  fromShopName?: string;
  toShopName?: string;

  // 🔹 roles coming from backend
  fromRole?: "OWNER" | "EMPLOYEE" | "USER" | "UNKNOWN";
  toRole?: "OWNER" | "EMPLOYEE" | "USER" | "UNKNOWN";

  actionType: ActionType;
  notes?: string;
  createdAt: string;
}

// helper: convert role code → label
const roleLabel = (
  r?: "OWNER" | "EMPLOYEE" | "USER" | "UNKNOWN"
): string => {
  if (r === "OWNER") return "Owner";
  if (r === "EMPLOYEE") return "Employee";
  if (r === "USER") return "Member";
  return "Member"; // fallback
};

export default function ScanHistory() {
  const params = useLocalSearchParams();
  const { token: ctxToken, user } = useAuth();

  const role = (params.role as Role) || (user?.role as Role) || "OWNER";
  const id = (params.id as string) || user?._id || "";
  const name = (params.name as string) || user?.name || "";
  const email = (params.email as string) || user?.email || "";
  const image = (params.image as string) || user?.avatar || "";
  const qrCodeUrl =
    (params.qrCodeUrl as string) || (user as any)?.qrCodeUrl || "";

  const profilePercent =
    Number(params.profilePercent as string) ||
    (user as any)?.profilePercent ||
    18;

  const isVerified =
    (params.isVerified as string) === "true" ||
    !!(user as any)?.isProfileVerified;

  const shopCompleted = user?.shopCompleted ?? false;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HistoryItem[]>([]);

  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [typeFilter, setTypeFilter] =
    useState<"ALL" | "BUY" | "RETURN">("ALL");
  const [roleFilter, setRoleFilter] = useState<
    "ALL" | "SENDER" | "RECEIVER"
  >("ALL");

  const [filterVisible, setFilterVisible] = useState(false);
  const [tempDateFilter, setTempDateFilter] =
    useState<DateFilter>(dateFilter);
  const [tempTypeFilter, setTempTypeFilter] =
    useState<"ALL" | "BUY" | "RETURN">(typeFilter);
  const [tempRoleFilter, setTempRoleFilter] =
    useState<"ALL" | "SENDER" | "RECEIVER">(roleFilter);

  const openFilterSheet = () => {
    setTempDateFilter(dateFilter);
    setTempTypeFilter(typeFilter);
    setTempRoleFilter(roleFilter);
    setFilterVisible(true);
  };

  const closeFilterSheet = () => setFilterVisible(false);

  const toggleFilterSheet = () => {
    filterVisible ? closeFilterSheet() : openFilterSheet();
  };

  const resetAllFilters = () => {
    setDateFilter("ALL");
    setTypeFilter("ALL");
    setRoleFilter("ALL");
    setTempDateFilter("ALL");
    setTempTypeFilter("ALL");
    setTempRoleFilter("ALL");
  };

  const applyFilters = () => {
    setDateFilter(tempDateFilter);
    setTypeFilter(tempTypeFilter);
    setRoleFilter(tempRoleFilter);
    setFilterVisible(false);
  };

  const appliedCount = useMemo(() => {
    let c = 0;
    if (dateFilter !== "ALL") c++;
    if (typeFilter !== "ALL") c++;
    if (roleFilter !== "ALL") c++;
    return c;
  }, [dateFilter, typeFilter, roleFilter]);

  /* ---------------------- LOAD HISTORY ---------------------- */
  const loadHistory = async () => {
    try {
      setLoading(true);

      let token = ctxToken || (await AsyncStorage.getItem("accessToken"));
      if (!token) {
        setItems([]);
        setLoading(false);
        return;
      }

      const url = `${baseURL}${SummaryApi.qr_history.url}?limit=200`;

      const res = await fetch(url, {
        method: SummaryApi.qr_history.method,
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      setItems(
        data.success && Array.isArray(data.data) ? data.data : []
      );
    } catch (err) {
      console.log("ScanHistory load error", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  /* ---------------------- FILTER + SORT ---------------------- */
  const dateFilterLabel =
    dateFilter === "ALL"
      ? "All time"
      : dateFilter === "TODAY"
      ? "Today"
      : dateFilter === "LAST_7"
      ? "Last 7 days"
      : "Last 30 days";

  const filteredItems = useMemo(() => {
    let list = [...items];

    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const msDay = 86400000;

    if (dateFilter !== "ALL") {
      const threshold =
        dateFilter === "TODAY"
          ? startOfToday.getTime()
          : dateFilter === "LAST_7"
          ? now.getTime() - 7 * msDay
          : now.getTime() - 30 * msDay;

      list = list.filter((item) => {
        const ct = new Date(item.createdAt).getTime();
        return !Number.isNaN(ct) && ct >= threshold;
      });
    }

    if (typeFilter !== "ALL") {
      list = list.filter((i) => i.actionType === typeFilter);
    }

    if (roleFilter !== "ALL") {
      list = list.filter((i) => i.selfRole === roleFilter);
    }

    return list;
  }, [items, dateFilter, typeFilter, roleFilter]);

  /* --------------------------- CARD UI --------------------------- */
  const renderItem: ListRenderItem<HistoryItem> = ({ item }) => {
    const date = new Date(item.createdAt);

    const dateTimeStr = date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const isBuy = item.actionType === "BUY";
    const isReturn = item.actionType === "RETURN";

    const senderName =
      item.fromName ||
      (item.selfRole === "SENDER"
        ? item.myName
        : item.oppositeName);

    const receiverName =
      item.toName ||
      (item.selfRole === "RECEIVER"
        ? item.myName
        : item.oppositeName);

    const fromRoleText = roleLabel(item.fromRole);
    const toRoleText = roleLabel(item.toRole);

    return (
      <View className="mb-3 px-1">
        <View className="rounded-2xl bg-white px-4 py-4 shadow-md border border-slate-100">
          {/* HEADER ROW WITH ICON + NAME + STATUS PILL */}
          <View className="flex-row justify-between items-center mb-1">
            {/* LEFT SIDE: ICON + NAME */}
            <View className="flex-row items-center">
              <Ionicons
                name="person-circle-outline"
                size={20}
                color="#64748b"
              />
              <Text
                className="ml-1 text-[13px] font-semibold text-slate-900"
                numberOfLines={1}
              >
                {item.selfRole === "SENDER"
                  ? receiverName
                  : senderName}
              </Text>
            </View>

            {/* RIGHT SIDE: BUY / RETURN PILL */}
            <View
              className={`flex-row items-center rounded-full px-3 py-1 ${
                isBuy
                  ? "bg-emerald-50"
                  : isReturn
                  ? "bg-amber-50"
                  : "bg-slate-100"
              }`}
            >
              <Ionicons
                name={
                  isBuy
                    ? "checkmark-circle-outline"
                    : isReturn
                    ? "arrow-undo-outline"
                    : "scan-outline"
                }
                size={14}
                color={
                  isBuy
                    ? "#059669"
                    : isReturn
                    ? "#d97706"
                    : "#64748b"
                }
              />

              <Text
                className="ml-1 text-[11px] font-semibold"
                style={{
                  color: isBuy
                    ? "#059669"
                    : isReturn
                    ? "#d97706"
                    : "#64748b",
                }}
              >
                {isBuy ? "Buy" : isReturn ? "Return" : "Scan"}
              </Text>
            </View>
          </View>
          {/* FROM → TO */}
          <View className="mt-2 flex-row items-center justify-between">
            {/* LEFT: FROM */}
            <View className="flex-1">
              <Text className="text-[10px] text-slate-400">From</Text>
              <Text
                className="text-[12px] font-semibold text-slate-800"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {senderName || "-"}
              </Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">
                {fromRoleText}
              </Text>
            </View>

            {/* ARROW */}
            <View className="px-3">
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#94a3b8"
              />
            </View>

            {/* RIGHT: TO */}
            <View className="flex-1 items-end">
              <Text className="text-[10px] text-slate-400">To</Text>
              <Text
                className="text-[12px] font-semibold text-slate-800 text-right"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {receiverName || "-"}
              </Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">
                {toRoleText}
              </Text>
            </View>
          </View>

          {/* SHOP */}
          <View className="mt-3 flex-row items-center">
            <Ionicons
              name="storefront-outline"
              size={13}
              color="#6366f1"
            />
            <Text className="ml-1 text-[10px] text-slate-500">
              Shop
            </Text>
            <Text className="flex-1 text-right text-[11px] text-slate-800">
              {item.fromShopName ||
                item.toShopName ||
                item.myShopName ||
                item.oppositeShopName ||
                "-"}
            </Text>
          </View>

          {/* NOTES + DATE */}
          {item.notes ? (
            <View className="mt-3 flex-row justify-between items-center">
              <Text className="text-[11px] text-slate-600 flex-1">
                <Text className="font-semibold">Notes:</Text>{" "}
                {item.notes}
              </Text>
              <Text className="text-[10px] text-slate-600 ml-3 text-right">
                <Text className="font-semibold">Date:</Text>{" "}
                {dateTimeStr}
              </Text>
            </View>
          ) : (
            <View className="mt-3 flex-row justify-end">
              <Text className="text-[10px] text-slate-500">
                {dateTimeStr}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  /* --------------------------- RENDER --------------------------- */
  const dateOptionLabel = (v: DateFilter) =>
    v === "ALL"
      ? "All time"
      : v === "TODAY"
      ? "Today"
      : v === "LAST_7"
      ? "Last 7 days"
      : "Last 30 days";

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="px-4 pt-3 pb-4 bg-white rounded-b-3xl shadow-md">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-slate-900">
                Scan History
              </Text>
              <Text className="text-[11px] text-slate-500">
                {dateFilterLabel} · Latest first
              </Text>
            </View>

            <TouchableOpacity
              onPress={toggleFilterSheet}
              className="flex-row items-center rounded-full bg-slate-100 px-3 py-1.5"
            >
              <Ionicons
                name={
                  filterVisible
                    ? "close-circle-outline"
                    : "options-outline"
                }
                size={16}
                color="#4B5563"
              />
              <Text className="ml-1 text-[11px] font-medium text-slate-700">
                {filterVisible ? "Close" : "Filters"}
                {appliedCount > 0 ? ` (${appliedCount})` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WHITE CARD CONTENT */}
        <View className="flex-1 px-3 pt-3 pb-1">
          <View className="flex-1 bg-white rounded-3xl px-4 pt-3 pb-1 shadow-lg">
            {loading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator color="#2563EB" />
                <Text className="text-xs text-slate-500 mt-2">
                  Loading history...
                </Text>
              </View>
            ) : filteredItems.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-sm text-slate-500">
                  No scans found for selected filters.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredItems}
                keyExtractor={(item, idx) =>
                  item.id || item._id || idx.toString()
                }
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
              />
            )}
          </View>
        </View>

        {/* FILTER BOTTOM SHEET */}
        <Modal
          visible={filterVisible}
          transparent
          animationType="slide"
          onRequestClose={closeFilterSheet}
        >
          <View className="flex-1 justify-end bg-black/40">
            <View className="bg-white rounded-t-3xl px-4 pt-3 pb-6 max-h-[85%]">
              {/* HANDLE */}
              <View className="items-center mb-3">
                <View className="w-16 h-1 bg-slate-300 rounded-full" />
              </View>

              {/* HEADER */}
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-semibold text-slate-600">
                  Filter by
                </Text>

                <TouchableOpacity onPress={closeFilterSheet}>
                  <Ionicons
                    name="close"
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* OPTIONS */}
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* DATE */}
                <Text className="text-[11px] font-semibold text-slate-700">
                  Date Range
                </Text>
                <View className="flex-row mt-1 space-x-2">
                  {["ALL", "TODAY", "LAST_7", "LAST_30"].map((v) => (
                    <TouchableOpacity
                      key={v}
                      onPress={() =>
                        setTempDateFilter(v as DateFilter)
                      }
                      className={`flex-1 px-3 py-1.5 rounded-xl border ${
                        tempDateFilter === v
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <Text
                        className={`text-[11px] ${
                          tempDateFilter === v
                            ? "text-indigo-700 font-bold"
                            : "text-slate-700"
                        }`}
                      >
                        {dateOptionLabel(v as DateFilter)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* TYPE */}
                <Text className="text-[11px] font-semibold text-slate-700 mt-4">
                  Scan Type
                </Text>
                <View className="flex-row mt-1 space-x-2">
                  {[
                    { key: "ALL", label: "All" },
                    { key: "BUY", label: "Buy" },
                    { key: "RETURN", label: "Return" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() =>
                        setTempTypeFilter(
                          opt.key as "ALL" | "BUY" | "RETURN"
                        )
                      }
                      className={`flex-1 px-3 py-1.5 rounded-xl border ${
                        tempTypeFilter === opt.key
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <Text
                        className={`text-[11px] ${
                          tempTypeFilter === opt.key
                            ? "text-indigo-700 font-bold"
                            : "text-slate-700"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* WHO */}
                <Text className="text-[11px] font-semibold text-slate-700 mt-4">
                  Who scanned
                </Text>
                <View className="flex-row mt-1 space-x-2">
                  {[
                    { key: "ALL", label: "All" },
                    { key: "SENDER", label: "You scanned" },
                    { key: "RECEIVER", label: "They scanned" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() =>
                        setTempRoleFilter(
                          opt.key as "ALL" | "SENDER" | "RECEIVER"
                        )
                      }
                      className={`flex-1 px-3 py-1.5 rounded-xl border ${
                        tempRoleFilter === opt.key
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <Text
                        className={`text-[11px] ${
                          tempRoleFilter === opt.key
                            ? "text-indigo-700 font-bold"
                            : "text-slate-700"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* BUTTONS */}
              <View className="flex-row mt-4 space-x-3">
                <TouchableOpacity
                  onPress={resetAllFilters}
                  className="flex-1 py-3 bg-slate-100 rounded-2xl items-center"
                >
                  <Text className="text-[12px] font-semibold text-slate-700">
                    Reset All
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={applyFilters}
                  className="flex-1 py-3 bg-indigo-600 rounded-2xl items-center"
                >
                  <Text className="text-[12px] font-semibold text-white">
                    Apply Filters{" "}
                    {appliedCount > 0 ? `(${appliedCount})` : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* BOTTOM NAV */}
        <View className="absolute bottom-0 left-0 right-0">
          <AppBottomNav
            active="history"
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
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
