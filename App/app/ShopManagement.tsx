// app/ShopManagement.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy"; // ✅ legacy API, no warning
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth } from "./context/AuthContext";
import { useRefreshUserOnFocus } from "./hooks/useRefreshUserOnFocus";

interface Address {
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

interface Employee {
  id: string;
  name: string;
  mobile: string;
  role: string;
  avatar?: string;
  status: "Active" | "Inactive";
}

interface PhoneContact {
  id: string;
  name: string;
  phone: string;
}

export default function ShopManagement() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  useRefreshUserOnFocus();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // --- Add employee form state (for modal) ---
  const [empName, setEmpName] = useState("");
  const [empMobile, setEmpMobile] = useState("");
  const [empPin, setEmpPin] = useState("");
  const [empAvatarUri, setEmpAvatarUri] = useState<string>(""); // preview
  const [empAvatarBase64, setEmpAvatarBase64] = useState<string>(""); // send to API
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // contacts picker
  const [contactsVisible, setContactsVisible] = useState(false);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // staff modal (only Add employee)
  const [staffModalVisible, setStaffModalVisible] = useState(false);

  // ---------- DERIVED FROM AUTH USER ----------
  const shopName = user?.shopName || user?.name || "My Shop";
  const shopAddress: Address = (user?.address as Address) || {};

  const formattedAddress = [
    shopAddress.street,
    shopAddress.area,
    shopAddress.city,
    shopAddress.district,
    shopAddress.state,
    shopAddress.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const role = (user?.role as any) || "OWNER";
  const profilePercent = user?.profilePercent ?? 0;

  /**
   * 🔒 HARD LOCK RULE
   * - OWNER/USER: user.isProfileVerified
   * - EMPLOYEE: owner.isProfileVerified
   */
  const profileLocked = useMemo(() => {
    const r = (user?.role as any) || "USER";
    if (r === "EMPLOYEE") return !!(user as any)?.owner?.isProfileVerified;
    return !!user?.isProfileVerified;
  }, [user]);

  const isVerified = !!profileLocked;

  const qrCodeUrl = (user as any)?.qrCodeUrl;
  const shopCompleted = (user as any)?.shopCompleted ?? false;

  const businessType = (user as any)?.BusinessType || "Business type not added";
  const category =
    (user as any)?.BusinessCategory || "Business category not added";

  const frontPhoto = (user as any)?.shopFront || "";
  const bannerPhoto = (user as any)?.shopBanner || "";

  // ✅ ONLY block Shop Edit (NOT employee actions)
  const blockIfLocked = (action: () => void) => {
    if (profileLocked) {
      Alert.alert(
        "Profile locked",
        "Your profile is verified by admin. Shop editing is disabled."
      );
      return;
    }
    action();
  };

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
        console.log("ShopManagement load employees error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [authLoading, user, token, router]);

  // -------- CAMERA (employee photo) ----------
  const captureEmployeePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission", "Please allow camera to take photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setEmpAvatarUri(uri);

      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });
        setEmpAvatarBase64(base64);
      } catch (err: any) {
        console.log("FileSystem read error:", err);
        Alert.alert("Error", "Unable to read image file.");
      }
    }
  };

  const resetForm = () => {
    setEmpName("");
    setEmpMobile("");
    setEmpPin("");
    setEmpAvatarUri("");
    setEmpAvatarBase64("");
    setShowPin(false);
  };

  // -------- CONTACTS PICKER ----------
  const openContactsPicker = async () => {
    try {
      setContactsLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "We need access to your contacts to import employee details."
        );
        setContactsLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (!data || data.length === 0) {
        Alert.alert("No contacts", "No contacts found on device.");
        setContactsLoading(false);
        return;
      }

      const mapped: PhoneContact[] = [];
      data.forEach((c) => {
        if (!c.phoneNumbers || c.phoneNumbers.length === 0) return;
        c.phoneNumbers.forEach((p) => {
          if (!p.number) return;
          mapped.push({
            id: `${c.id}-${p.id}`,
            name: c.name || "Unnamed",
            phone: p.number,
          });
        });
      });

      if (mapped.length === 0) {
        Alert.alert("No phone numbers", "No phone numbers found in contacts.");
        setContactsLoading(false);
        return;
      }

      setContacts(mapped);
      setContactsVisible(true);
    } catch (err) {
      console.log("openContactsPicker error:", err);
      Alert.alert("Error", "Unable to open contacts.");
    } finally {
      setContactsLoading(false);
    }
  };

  const handleSelectContact = (c: PhoneContact) => {
    setEmpName(c.name);
    const cleaned = c.phone.replace(/[^0-9+]/g, "");
    setEmpMobile(cleaned);
    setContactsVisible(false);
  };

  // ======== ADD EMPLOYEE =========
  const onAddEmployee = async () => {
    if (!empName || !empMobile || !empPin) {
      Alert.alert(
        "Missing fields",
        "Please fill name, mobile and PIN for the employee."
      );
      return;
    }

    if (!/^\d{4,6}$/.test(empPin)) {
      Alert.alert("Invalid PIN", "PIN must be 4–6 digits.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${baseURL}${SummaryApi.employee_create.url}`, {
        method: SummaryApi.employee_create.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: empName,
          mobile: empMobile,
          pin: empPin,
          avatarBase64: empAvatarBase64 || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        console.log("create employee error:", json);
        Alert.alert("Error", json.message || "Failed to add employee");
        return;
      }

      const e = json.data;
      setEmployees((prev) => [
        {
          id: e.id || e._id,
          name: e.name,
          mobile: e.mobile,
          role: e.role || "EMPLOYEE",
          avatar: e.avatar,
          status: (e.status as "Active" | "Inactive") || "Active",
        },
        ...prev,
      ]);

      Alert.alert("Success", "Employee added successfully");
      resetForm();
      setStaffModalVisible(false);
    } catch (err) {
      console.log("onAddEmployee error:", err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- LOADING STATES ----------
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
            Loading shop & employees...
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
          <Text className="mb-2 text-lg font-bold text-white">Please login</Text>
          <Text className="text-sm text-white/80">
            You need to sign in to manage your shop.
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ---------- UI ----------
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
              onPress={() => router.replace("/Home")}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="flex-1 text-center text-sm font-semibold text-white">
              Shop management
            </Text>

            <View className="h-10 w-10" />
          </View>
        </View>

        <View className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          >
            {/* 🔒 LOCK BANNER (info only) */}
            {profileLocked && (
              <View className="mb-4 flex-row items-center rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                <View className="mr-3 rounded-full bg-emerald-100 p-2">
                  <Ionicons name="lock-closed" size={18} color="#047857" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-emerald-900">
                    Profile verified
                  </Text>
                  <Text className="mt-1 text-[11px] text-emerald-700">
                    Shop editing is locked. Staff management is still available.
                  </Text>
                </View>
              </View>
            )}

            {/* STORE DETAILS CARD */}
            <View className="mb-4 rounded-2xl border border-white/40 bg-white/95 p-4 shadow-md shadow-slate-900/10">
              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                    <Ionicons
                      name="storefront-outline"
                      size={20}
                      color="#2563EB"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-semibold text-slate-500">
                      STORE DETAILS
                    </Text>
                    <View className="mt-1 flex-row items-center">
                      <Text className="text-base font-semibold text-slate-900">
                        {shopName}
                      </Text>
                      {isVerified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#22c55e"
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </View>
                  </View>
                </View>

                {/* 🔒 ONLY THIS IS BLOCKED */}
                <TouchableOpacity
                  onPress={() => blockIfLocked(() => router.push("/Shop"))}
                  activeOpacity={0.9}
                  className={`ml-2 flex-row items-center rounded-full px-3 py-1 ${
                    profileLocked ? "bg-slate-200" : "bg-blue-50"
                  }`}
                >
                  <Ionicons
                    name="create-outline"
                    size={14}
                    color={profileLocked ? "#6b7280" : "#2563EB"}
                  />
                  <Text
                    className={`ml-1 text-[10px] font-semibold ${
                      profileLocked ? "text-slate-600" : "text-blue-700"
                    }`}
                  >
                    {profileLocked ? "Locked" : "Edit"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mt-2">
                <View className="mb-1 flex-row items-center">
                  <Ionicons name="briefcase-outline" size={14} color="#6b7280" />
                  <Text className="ml-1 text-[11px] font-semibold text-slate-700">
                    Business type
                  </Text>
                </View>
                <Text className="text-[11px] text-slate-600">{businessType}</Text>
              </View>

              <View className="mt-3">
                <View className="mb-1 flex-row items-center">
                  <Ionicons name="pricetag-outline" size={14} color="#6b7280" />
                  <Text className="ml-1 text-[11px] font-semibold text-slate-700">
                    Category
                  </Text>
                </View>
                <Text className="text-[11px] text-slate-600">{category}</Text>
              </View>

              <View className="mt-3">
                <View className="mb-1 flex-row items-center">
                  <Ionicons name="location-outline" size={14} color="#6b7280" />
                  <Text className="ml-1 text-[11px] font-semibold text-slate-700">
                    Address
                  </Text>
                </View>
                <Text className="text-[11px] leading-4 text-slate-600">
                  {formattedAddress}
                </Text>
              </View>
            </View>

            {/* SHOP PHOTOS CARD (view only) */}
            <View className="mb-4 rounded-2xl border border-white/40 bg-white/95 p-4 shadow-md shadow-slate-900/10">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-slate-900">Shop photos</Text>
                <Text className="text-[10px] text-slate-500">
                  Front · Banner / Inside view
                </Text>
              </View>

              <View className="flex-row space-x-2">
                <View className="flex-1 p-1">
                  <Text className="mb-1 text-[10px] font-medium text-slate-600">
                    Shop Front View
                  </Text>
                  {frontPhoto ? (
                    <Image
                      source={{ uri: frontPhoto }}
                      className="h-28 w-full rounded-xl"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-28 w-full items-center justify-center rounded-xl bg-slate-100">
                      <Ionicons name="image-outline" size={20} color="#9ca3af" />
                      <Text className="mt-1 text-[10px] text-slate-400">No image</Text>
                    </View>
                  )}
                </View>

                <View className="flex-1 p-1">
                  <Text className="mb-1 text-[10px] font-medium text-slate-600">
                    Shop Banner or Visiting Card
                  </Text>
                  {bannerPhoto ? (
                    <Image
                      source={{ uri: bannerPhoto }}
                      className="h-28 w-full rounded-xl"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-28 w-full items-center justify-center rounded-xl bg-slate-100">
                      <Ionicons name="image-outline" size={20} color="#9ca3af" />
                      <Text className="mt-1 text-[10px] text-slate-400">No image</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* ✅ STAFF MANAGEMENT (NOT BLOCKED) */}
            <View className="mb-4">
              <Text className="mb-1 text-xs font-semibold text-white/90">
                Staff Management
              </Text>

              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => setStaffModalVisible(true)}
                  activeOpacity={0.9}
                  className="mr-2 flex-1 items-center rounded-2xl bg-white/95 p-3 shadow-md shadow-slate-900/15"
                >
                  <View className="mb-2 h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                    <Ionicons name="person-add-outline" size={18} color="#2563EB" />
                  </View>
                  <Text className="text-center text-[11px] font-semibold text-slate-900">
                    Add employee
                  </Text>
                  <Text className="mt-1 text-center text-[10px] leading-4 text-slate-500">
                    Create staff login using mobile & PIN.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/StaffManagement")}
                  activeOpacity={0.9}
                  className="flex-1 items-center rounded-2xl bg-white/95 p-3 shadow-md shadow-slate-900/15"
                >
                  <View className="mb-2 h-9 w-9 items-center justify-center rounded-full bg-pink-50">
                    <Ionicons name="people-outline" size={18} color="#EC4899" />
                  </View>
                  <Text className="text-center text-[11px] font-semibold text-slate-900">
                    Staff list
                  </Text>
                  <Text className="mt-1 text-center text-[10px] leading-4 text-slate-500">
                    View all staff, status & edit details.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* CONTACTS MODAL */}
          <Modal
            visible={contactsVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setContactsVisible(false)}
          >
            <View className="flex-1 justify-end bg-black/40">
              <View className="max-h-[70%] rounded-t-3xl bg-white p-4 shadow-2xl">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-slate-900">
                    Select contact
                  </Text>
                  <TouchableOpacity onPress={() => setContactsVisible(false)}>
                    <Ionicons name="close" size={20} color="#4b5563" />
                  </TouchableOpacity>
                </View>

                <ScrollView keyboardShouldPersistTaps="handled">
                  {contacts.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => handleSelectContact(c)}
                      className="mb-2 flex-row items-center justify-between rounded-xl bg-blue-50 px-2 py-2"
                    >
                      <View>
                        <Text className="text-xs font-semibold text-slate-900">
                          {c.name}
                        </Text>
                        <Text className="text-[11px] text-slate-600">{c.phone}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* ADD EMPLOYEE MODAL (ALWAYS OPENABLE) */}
          <Modal
            visible={staffModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => {
              setStaffModalVisible(false);
              resetForm();
            }}
          >
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
            >
              <View className="flex-1 justify-end bg-black/40">
                <View className="max-h-[85%] rounded-t-3xl bg-white px-4 pt-4 pb-6 shadow-2xl">
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-slate-900">
                      Add employee
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setStaffModalVisible(false);
                        resetForm();
                      }}
                    >
                      <Ionicons name="close" size={20} color="#4b5563" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 40 }}
                  >
                    <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <Text className="text-xs font-semibold text-slate-900">
                        Add employee
                      </Text>
                      <Text className="mb-3 mt-1 text-[11px] text-slate-500">
                        Create staff login using mobile number and PIN.
                      </Text>

                      {/* Name */}
                      <Text className="mb-1 text-xs font-medium text-slate-600">
                        Employee name
                      </Text>
                      <TextInput
                        value={empName}
                        onChangeText={setEmpName}
                        placeholder="Employee name"
                        placeholderTextColor="#9ca3af"
                        className="mb-3 h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                      />

                      {/* Mobile + contact */}
                      <View className="mb-3 flex-row items-center">
                        <View className="mr-2 flex-1">
                          <Text className="mb-1 text-xs font-medium text-slate-600">
                            Mobile number (WhatsApp)
                          </Text>
                          <TextInput
                            value={empMobile}
                            onChangeText={setEmpMobile}
                            placeholder="10-digit mobile"
                            keyboardType="phone-pad"
                            placeholderTextColor="#9ca3af"
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                          />
                        </View>
                        <TouchableOpacity
                          onPress={openContactsPicker}
                          disabled={contactsLoading}
                          className="mt-5 h-11 w-11 items-center justify-center rounded-full bg-blue-50"
                        >
                          {contactsLoading ? (
                            <ActivityIndicator size="small" color="#2563EB" />
                          ) : (
                            <Ionicons name="call-outline" size={18} color="#2563EB" />
                          )}
                        </TouchableOpacity>
                      </View>
                      <Text className="mb-2 text-[10px] text-slate-500">
                        Tap phone icon to pick name & mobile from contacts.
                      </Text>

                      {/* PIN */}
                      <Text className="mb-1 text-xs font-medium text-slate-600">
                        Login PIN (4–6 digits)
                      </Text>
                      <View className="mb-3 flex-row items-center">
                        <View className="flex-1">
                          <TextInput
                            value={empPin}
                            onChangeText={setEmpPin}
                            placeholder="4–6 digit PIN"
                            keyboardType="number-pad"
                            secureTextEntry={!showPin}
                            placeholderTextColor="#9ca3af"
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => setShowPin((p) => !p)}
                          className="ml-2 h-11 w-11 items-center justify-center"
                        >
                          <Ionicons
                            name={showPin ? "eye-off-outline" : "eye-outline"}
                            size={18}
                            color="#6b7280"
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Photo */}
                      <Text className="mb-1 text-xs font-medium text-slate-600">
                        Employee photo (optional)
                      </Text>
                      <View className="mb-3 flex-row items-center">
                        {empAvatarUri ? (
                          <Image
                            source={{ uri: empAvatarUri }}
                            className="mr-3 h-14 w-14 rounded-full"
                          />
                        ) : (
                          <View className="mr-3 h-14 w-14 items-center justify-center rounded-full bg-slate-200">
                            <Ionicons name="person-outline" size={20} color="#6b7280" />
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={captureEmployeePhoto}
                          className="h-10 flex-1 items-center justify-center rounded-full bg-blue-600"
                        >
                          <Text className="text-xs font-semibold text-white">
                            Capture photo
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Save button */}
                      <TouchableOpacity
                        disabled={submitting}
                        onPress={onAddEmployee}
                        className="mt-1 h-11 items-center justify-center rounded-full bg-blue-600"
                      >
                        {submitting ? (
                          <ActivityIndicator color="#eff6ff" />
                        ) : (
                          <Text className="text-sm font-semibold text-white">
                            Save employee
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>

        {/* FIXED BOTTOM NAV */}
        <View className="absolute left-0 right-0 bottom-0 bg-white shadow-md">
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
