// app/StaffManagement.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth } from "./context/AuthContext";

interface Employee {
  id: string;
  name: string;
  mobile: string;
  role: string;
  avatar?: string;
  status: "Active" | "Inactive";
}

export default function StaffManagement() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // edit employee modal
  const [editVisible, setEditVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const role = user?.role || "OWNER";
  const profilePercent = user?.profilePercent ?? 0;
  const isVerified = !!user?.isProfileVerified;
  const qrCodeUrl = user?.qrCodeUrl;
  const shopCompleted = user?.shopCompleted ?? false;

  // ---------- LOAD EMPLOYEES ----------
  useEffect(() => {
    if (authLoading) return;

    if (!user || !token) {
      Alert.alert("Not logged in", "Please login again.");
      router.replace("/Login");
      return;
    }

    const loadEmployees = async () => {
      try {
        const empRes = await fetch(`${baseURL}${SummaryApi.employee_my.url}`, {
          method: SummaryApi.employee_my.method,
          headers: { Authorization: `Bearer ${token}` },
        });

        const empJson = await empRes.json();
        if (empRes.ok && empJson.success) {
          const list: Employee[] = (empJson.data || []).map((e: any) => ({
            id: e.id || e._id,
            name: e.name,
            mobile: e.mobile,
            role: e.role || "EMPLOYEE",
            avatar: e.avatar,
            status: (e.status as "Active" | "Inactive") || "Active",
          }));
          setEmployees(list);
        } else {
          console.log("employees error:", empJson);
        }
      } catch (err) {
        console.log("StaffManagement load employees error:", err);
        Alert.alert("Error", "Unable to load employees.");
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [authLoading, user, token, router]);

  const onToggleStatus = async (emp: Employee) => {
    const newStatus: "Active" | "Inactive" =
      emp.status === "Active" ? "Inactive" : "Active";

    try {
      const res = await fetch(
        `${baseURL}${SummaryApi.employee_update.url}/${emp.id}`,
        {
          method: SummaryApi.employee_update.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        console.log("toggle status error:", json);
        Alert.alert("Error", json.message || "Failed to update status");
        return;
      }

      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, status: newStatus } : e))
      );
    } catch (err) {
      console.log("onToggleStatus error:", err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const openEdit = (emp: Employee) => {
    setEditId(emp.id);
    setEditName(emp.name);
    setEditMobile(emp.mobile);
    setEditPin("");
    setEditVisible(true);
  };

  const onSaveEdit = async () => {
    if (!editId) return;

    if (!editName || !editMobile) {
      Alert.alert("Missing fields", "Name and mobile are required.");
      return;
    }

    if (editPin && !/^\d{4,6}$/.test(editPin)) {
      Alert.alert("Invalid PIN", "PIN must be 4–6 digits.");
      return;
    }

    try {
      setEditSubmitting(true);

      const body: any = {
        name: editName,
        mobile: editMobile,
      };
      if (editPin) {
        body.pin = editPin;
      }

      const res = await fetch(
        `${baseURL}${SummaryApi.employee_update.url}/${editId}`,
        {
          method: SummaryApi.employee_update.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        console.log("update employee error:", json);
        Alert.alert("Error", json.message || "Failed to update employee");
        return;
      }

      const updated = json.data;
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === (updated.id || updated._id)
            ? {
                ...e,
                name: updated.name,
                mobile: updated.mobile,
                status:
                  (updated.status as "Active" | "Inactive") || e.status,
              }
            : e
        )
      );

      Alert.alert("Success", "Employee updated successfully");
      setEditVisible(false);
    } catch (err) {
      console.log("onSaveEdit error:", err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ---------- LOADING ----------
  if (authLoading || loading) {
    return (
      <LinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFFFFF" />
          <Text className="mt-2 text-xs text-white">
            Loading employees...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="mb-2 text-lg font-bold text-white">
            Please login
          </Text>
          <Text className="text-sm text-white/80">
            You need to sign in to manage employees.
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="px-4 pb-3 pt-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.replace("/ShopManagement")}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="flex-1 text-center text-sm font-semibold text-white">
              Staff list
            </Text>

            <View className="h-10 w-10" />
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-1">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 110, // space so last row not hidden behind nav
              }}
            >
              <View className="mt-1 rounded-2xl border border-white/40 bg-white/95 p-4 shadow-md shadow-slate-900/10">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-slate-900">
                    Employee list
                  </Text>
                  <Text className="text-[10px] text-slate-500">
                    {employees.length} employee
                    {employees.length === 1 ? "" : "s"}
                  </Text>
                </View>

                {/* Header Row: S.No | Photo | Name | Mobile | Status | Edit */}
                <View className="mb-2 flex-row items-center border-b border-slate-200 pb-1">
                  <Text className="w-10 text-[10px] font-semibold text-slate-500">
                    S.No
                  </Text>
                  <Text className="w-10 text-[10px] font-semibold text-slate-500">
                    Photo
                  </Text>
                  <Text className="flex-1 text-[10px] font-semibold text-slate-500">
                    Name
                  </Text>
                  <Text className="w-24 text-[10px] font-semibold text-slate-500">
                    Mobile
                  </Text>
                  <Text className="w-18 text-[10px] font-semibold text-slate-500">
                    Status
                  </Text>
                  <Text className="w-12 text-right text-[10px] font-semibold text-slate-500">
                    Edit
                  </Text>
                </View>

                {employees.length === 0 ? (
                  <Text className="text-[11px] text-slate-500">
                    No employees added yet.
                  </Text>
                ) : (
                  employees.map((emp, index) => (
                    <View
                      key={emp.id}
                      className="mb-2 flex-row items-center rounded-xl bg-slate-50 px-2 py-2"
                    >
                      {/* S.No */}
                      <View className="w-10 items-center">
                        <View className="h-6 w-6 items-center justify-center rounded-full bg-white">
                          <Text className="text-[10px] font-semibold text-slate-700">
                            {index + 1}
                          </Text>
                        </View>
                      </View>

                      {/* Photo */}
                      <View className="w-10 items-center">
                        {emp.avatar ? (
                          <Image
                            source={{ uri: emp.avatar }}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                            <Ionicons
                              name="person-outline"
                              size={14}
                              color="#6b7280"
                            />
                          </View>
                        )}
                      </View>

                      {/* Name */}
                      <View className="flex-1">
                        <Text className="text-[11px] font-semibold text-slate-900">
                          {emp.name}
                        </Text>
                      </View>

                      {/* Mobile */}
                      <View className="w-24">
                        <Text className="text-[10px] text-slate-600">
                          {emp.mobile}
                        </Text>
                      </View>

                      {/* Status */}
                      <View className="w-18 items-center">
                        <Switch
                          value={emp.status === "Active"}
                          onValueChange={() => onToggleStatus(emp)}
                          thumbColor={
                            emp.status === "Active" ? "#22c55e" : "#d1d5db"
                          }
                          trackColor={{ true: "#bbf7d0", false: "#e5e7eb" }}
                        />
                      </View>

                      {/* Edit */}
                      <View className="w-12 items-end">
                        <TouchableOpacity
                          onPress={() => openEdit(emp)}
                          className="flex-row items-center rounded-full bg-blue-50 px-2 py-1"
                        >
                          <Ionicons
                            name="create-outline"
                            size={12}
                            color="#2563EB"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            {/* EDIT MODAL */}
            <Modal
              visible={editVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setEditVisible(false)}
            >
              <View className="flex-1 justify-end bg-black/40">
                <View className="rounded-t-3xl bg-white p-4 shadow-2xl">
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-slate-900">
                      Edit employee
                    </Text>
                    <TouchableOpacity onPress={() => setEditVisible(false)}>
                      <Ionicons name="close" size={20} color="#4b5563" />
                    </TouchableOpacity>
                  </View>

                  <Text className="mb-1 text-xs font-medium text-slate-600">
                    Name
                  </Text>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    className="mb-3 h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
                  />

                  <Text className="mb-1 text-xs font-medium text-slate-600">
                    Mobile
                  </Text>
                  <TextInput
                    value={editMobile}
                    onChangeText={setEditMobile}
                    keyboardType="phone-pad"
                    className="mb-3 h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
                  />

                  <Text className="mb-1 text-xs font-medium text-slate-600">
                    New PIN (optional)
                  </Text>
                  <TextInput
                    value={editPin}
                    onChangeText={setEditPin}
                    keyboardType="number-pad"
                    placeholder="Leave blank to keep current PIN"
                    placeholderTextColor="#9ca3af"
                    className="mb-5 h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
                  />

                  <TouchableOpacity
                    disabled={editSubmitting}
                    onPress={onSaveEdit}
                    className="h-11 items-center justify-center rounded-full bg-blue-600"
                  >
                    {editSubmitting ? (
                      <ActivityIndicator color="#eff6ff" />
                    ) : (
                      <Text className="text-sm font-semibold text-white">
                        Save changes
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

        </View>
    
          {/* BOTTOM NAV (same style as Home) */}
          <View className="absolute inset-x-0 bottom-0 bg-white shadow-md">
            <AppBottomNav
              active="shop"
              role={role as any}
              id={user._id}
              name={user.name}
              email={user.email}
              image={user.avatar}
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
