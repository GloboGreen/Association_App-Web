// app/SubscriptionHistory.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth, type Role } from "./context/AuthContext";

type Status = "PAID" | "FAILED";

interface SubscriptionRow {
  _id: string;
  monthKey: string; // "2025-11"
  subscriptionAmount: number;
  meetingAmount?: number;
  status: Status;
  paidDate?: string;
  notes?: string;
}

interface MySubResponse {
  success: boolean;
  data?: SubscriptionRow[];
}

const MAX_ROWS = 6; // latest 6 rows

export default function SubscriptionHistory() {
  const router = useRouter();
  const { user, token: ctxToken } = useAuth();
  const role: Role = (user?.role as Role) || "USER";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [monthFilter, setMonthFilter] = useState<string>(""); // "" = all
  const shopCompleted = user?.shopCompleted ?? false;

  // -------- load my subscription from API ----------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        let token = ctxToken;
        if (!token) {
          token = await AsyncStorage.getItem("accessToken");
        }

        if (!token) {
          console.log("No token, cannot load subscriptions");
          setRows([]);
          return;
        }

        const res = await fetch(
          `${baseURL}${SummaryApi.subscription_my.url}`,
          {
            method: SummaryApi.subscription_my.method,
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const json = (await res.json()) as MySubResponse;
        console.log("📥 My subscription:", json);

        if (json.success && Array.isArray(json.data)) {
          setRows(json.data);
        } else {
          setRows([]);
        }
      } catch (err) {
        console.log("My subscription error:", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ctxToken]);

  // sort latest month first
  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1)),
    [rows]
  );

  // distinct month options for filter
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    sortedRows.forEach((r) => {
      if (r.monthKey) set.add(r.monthKey);
    });
    return Array.from(set).sort().reverse(); // latest first
  }, [sortedRows]);

  // apply filter
  const filteredRows = useMemo(
    () =>
      sortedRows.filter((row) =>
        monthFilter ? row.monthKey === monthFilter : true
      ),
    [sortedRows, monthFilter]
  );

  // limit rows to keep table short
  const limitedRows = useMemo(
    () => filteredRows.slice(0, MAX_ROWS),
    [filteredRows]
  );

  const formatMonth = (monthKey: string) => {
    const [yearStr, monthStr] = monthKey.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    if (!year || monthIndex < 0) return monthKey;

    const d = new Date(year, monthIndex, 1);
    return d.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  // ------------- loading state ---------------
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
          <Text className="mt-2 text-sm text-slate-100">
            Loading subscription...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ------------- UI ---------------
  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Top bar (white card) */}
        <View className="px-4 pt-3 pb-4 bg-white rounded-b-3xl shadow-md shadow-slate-900/20">
          <View className="flex-row items-center">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-blue-600/90"
            >
              <Ionicons name="chevron-back" size={20} color="#EEF2FF" />
            </TouchableOpacity>

            <View className="flex-1">
              <Text className="text-[11px] text-slate-500">
                Association Subscription
              </Text>
              <Text className="text-lg font-semibold text-slate-900">
                My Subscription
              </Text>
            </View>

            {/* Right badge */}
            <View className="flex-row items-center rounded-full bg-blue-50 px-3 py-1">
              <Ionicons name="calendar-outline" size={14} color="#2563EB" />
              <Text className="ml-1 text-[10px] font-medium text-blue-700">
                Latest months
              </Text>
            </View>
          </View>
        </View>

        {/* List + filters */}
        <ScrollView className="flex-1 px-4 pt-3 pb-20">
          {/* Month filter chips */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between">
              <Text className="mb-1 text-[11px] font-medium text-slate-100">
                Filter by month
              </Text>
              <Text className="text-[10px] text-slate-100">
                Showing{" "}
                <Text className="font-semibold text-white">
                  {limitedRows.length}
                </Text>{" "}
                of{" "}
                <Text className="font-semibold text-slate-50">
                  {filteredRows.length}
                </Text>
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {/* All chip */}
              <TouchableOpacity
                className={`mr-2 rounded-full border px-3 py-1 ${
                  monthFilter === ""
                    ? "border-blue-500 bg-blue-100"
                    : "border-slate-200 bg-white"
                }`}
                onPress={() => setMonthFilter("")}
              >
                <Text
                  className={`text-[11px] ${
                    monthFilter === ""
                      ? "font-semibold text-blue-800"
                      : "text-slate-600"
                  }`}
                >
                  All
                </Text>
              </TouchableOpacity>

              {monthOptions.map((mk) => (
                <TouchableOpacity
                  key={mk}
                  className={`mr-2 rounded-full border px-3 py-1 ${
                    monthFilter === mk
                      ? "border-blue-500 bg-blue-100"
                      : "border-slate-200 bg-white"
                  }`}
                  onPress={() => setMonthFilter(mk)}
                >
                  <Text
                    className={`text-[11px] ${
                      monthFilter === mk
                        ? "font-semibold text-blue-800"
                        : "text-slate-600"
                    }`}
                  >
                    {formatMonth(mk)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* If no data */}
          {limitedRows.length === 0 ? (
            <View className="mt-10 items-center">
              <Ionicons name="receipt-outline" size={42} color="#E0EAFF" />
              <Text className="mt-3 text-sm font-medium text-slate-100">
                No subscription records
              </Text>
              <Text className="mt-1 max-w-[260px] text-center text-xs text-slate-100/80">
                Once you pay your monthly association subscription, it will
                show here with status and amounts.
              </Text>
            </View>
          ) : (
            <>
              {/* Table-style container */}
              <View className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
                {/* Header row */}
                <View className="flex-row border-b border-blue-100 bg-blue-50 px-2 py-2">
                  <Text className="flex-[0.5] text-[10px] font-semibold text-slate-600">
                    S.No
                  </Text>
                  <Text className="flex-[1.1] text-[10px] font-semibold text-slate-600">
                    Month
                  </Text>
                  <Text className="flex-[0.9] text-right text-[10px] font-semibold text-slate-600">
                    Sub
                  </Text>
                  <Text className="flex-[0.9] text-right text-[10px] font-semibold text-slate-600">
                    Meeting
                  </Text>
                  <Text className="flex-[0.9] pr-2 text-right text-[10px] font-semibold text-slate-600">
                    Total
                  </Text>
                  <Text className="flex-[1.4] pl-2 text-[10px] font-semibold text-slate-600">
                    Paid Date
                  </Text>
                  <Text className="flex-[0.8] text-[10px] font-semibold text-slate-600">
                    Status
                  </Text>
                </View>

                {/* Data rows */}
                {limitedRows.map((row, idx) => {
                  const subAmt = row.subscriptionAmount || 0;
                  const meetAmt = row.meetingAmount || 0;
                  const total = subAmt + meetAmt;

                  return (
                    <View
                      key={row._id}
                      className="flex-row items-center border-b border-slate-100 px-2 py-1.5"
                    >
                      <Text className="flex-[0.5] text-[11px] text-slate-700">
                        {idx + 1}
                      </Text>

                      <Text
                        className="flex-[1.1] text-[11px] text-slate-700"
                        numberOfLines={1}
                      >
                        {formatMonth(row.monthKey)}
                      </Text>

                      <Text className="flex-[0.9] text-right text-[11px] text-slate-800">
                        ₹ {subAmt.toFixed(0)}
                      </Text>

                      <Text className="flex-[0.9] text-right text-[11px] text-slate-800">
                        {meetAmt > 0 ? `₹ ${meetAmt.toFixed(0)}` : "-"}
                      </Text>

                      <Text className="flex-[0.9] pr-2 text-right text-[11px] font-semibold text-blue-700">
                        ₹ {total.toFixed(0)}
                      </Text>

                      <Text
                        className="flex-[1.4] pl-2 text-[11px] text-slate-700"
                        numberOfLines={1}
                      >
                        {formatDate(row.paidDate)}
                      </Text>

                      <View className="flex-[0.8] items-center">
                        <View
                          className={`rounded-full px-2 py-[1px] ${
                            row.status === "PAID"
                              ? "bg-blue-50"
                              : "bg-rose-50"
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-semibold ${
                              row.status === "PAID"
                                ? "text-blue-700"
                                : "text-rose-600"
                            }`}
                          >
                            {row.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom nav */}
        <AppBottomNav
          active="profile"
          role={role}
          id={user?._id}
          name={user?.name}
          email={user?.email}
          image={user?.avatar}
          qrCodeUrl={(user as any)?.qrCodeUrl}
          profilePercent={(user as any)?.profilePercent}
          isVerified={!!(user as any)?.isProfileVerified}
          shopCompleted={shopCompleted}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
