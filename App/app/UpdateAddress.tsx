// app/UpdateAddress.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth } from "./context/AuthContext";
import { useRefreshUserOnFocus } from "./hooks/useRefreshUserOnFocus";

export default function UpdateAddress() {
  const router = useRouter();
  const { user, token, loading, setAuth, refreshUser } = useAuth();

  // ✅ refresh latest user on open
  useRefreshUserOnFocus();

  const initialAddress = user?.address || {};

  const [street, setStreet] = useState(initialAddress.street || "");
  const [area, setArea] = useState(initialAddress.area || ""); // Village
  const [city, setCity] = useState(initialAddress.city || ""); // Taluk
  const [district, setDistrict] = useState(initialAddress.district || "");
  const [stateVal, setStateVal] = useState(initialAddress.state || "");
  const [pincode, setPincode] = useState(initialAddress.pincode || "");
  const [saving, setSaving] = useState(false);

  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [talukOptions, setTalukOptions] = useState<string[]>([]);
  const [villageOptions, setVillageOptions] = useState<string[]>([]);

  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showTalukDropdown, setShowTalukDropdown] = useState(false);
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);

  const [stateSearch, setStateSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [talukSearch, setTalukSearch] = useState("");
  const [villageSearch, setVillageSearch] = useState("");

  // 🔒 HARD LOCK:
  // - OWNER/USER: user.isProfileVerified
  // - EMPLOYEE: user.owner.isProfileVerified (common in your data)
  const profileLocked =
    user?.role === "EMPLOYEE"
      ? !!(user as any)?.owner?.isProfileVerified
      : !!user?.isProfileVerified;

  useEffect(() => {
    if (!loading && (!user || !token)) {
      router.replace("/Login");
    }
  }, [loading, user, token, router]);

  useEffect(() => {
    if (!user) return;
    const a = user.address || {};
    setStreet(a.street || "");
    setArea(a.area || "");
    setCity(a.city || "");
    setDistrict(a.district || "");
    setStateVal(a.state || "");
    setPincode(a.pincode || "");
  }, [user?._id]);

  // ------------------ Load States ------------------
  useEffect(() => {
    const loadStates = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${baseURL}${SummaryApi.locations_states.url}`, {
          headers,
        });
        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          const list: string[] = json.data
            .map((s: any) => {
              if (typeof s === "string") return s;
              if (s && typeof s === "object")
                return s.state || s.stateName || s.name || "";
              return "";
            })
            .filter((x: string) => x.trim().length > 0);

          setStateOptions(list);
        }
      } catch (err) {
        console.log("Error loading states:", err);
      }
    };
    loadStates();
  }, [token]);

  // ------------------ Load Districts ------------------
  useEffect(() => {
    const loadDistricts = async () => {
      if (!stateVal) {
        setDistrictOptions([]);
        setDistrict("");
        setCity("");
        setTalukOptions([]);
        setArea("");
        setVillageOptions([]);
        return;
      }

      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const url =
          `${baseURL}${SummaryApi.locations_districts.url}` +
          `?state=${encodeURIComponent(stateVal)}`;

        const res = await fetch(url, { headers });
        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          const raw = json.data.map((d: any) => {
            if (typeof d === "string") return d;
            if (d && typeof d === "object") return d.district || d.name || "";
            return "";
          });
          const list = raw.filter((x: string) => x.trim().length > 0);

          setDistrictOptions(list);

          if (district && !list.includes(district)) {
            setDistrict("");
            setCity("");
            setTalukOptions([]);
            setArea("");
            setVillageOptions([]);
          }
        }
      } catch (err) {
        console.log("Error loading districts:", err);
      }
    };

    loadDistricts();
  }, [stateVal, token, district]);

  // ------------------ Load Taluks (FIXED) ------------------
  useEffect(() => {
    const loadTaluks = async () => {
      if (!stateVal || !district) {
        setTalukOptions([]);
        setCity("");
        setVillageOptions([]);
        return;
      }

      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const url =
          `${baseURL}${SummaryApi.locations_taluks.url}` +
          `?state=${encodeURIComponent(stateVal)}` +
          `&district=${encodeURIComponent(district)}`;

        const res = await fetch(url, { headers });
        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          const raw = json.data.map((t: any) => {
            if (typeof t === "string") return t;
            if (t && typeof t === "object")
              return t.taluk || t.talukName || t.name || "";
            return "";
          });

          let list = raw.filter((x: string) => x.trim().length > 0);

          // ✅ keep custom taluk (if user selected/typed one not in API list)
          if (city && !list.includes(city)) {
            list = [city, ...list];
          }

          setTalukOptions(list);
        }
      } catch (err) {
        console.log("Error loading taluks:", err);
      }
    };

    loadTaluks();
  }, [stateVal, district, token]); // ✅ removed city

  // ------------------ Load Villages ------------------
  useEffect(() => {
    const loadVillages = async () => {
      if (!stateVal || !district || !city) {
        setVillageOptions([]);
        return;
      }

      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const url =
          `${baseURL}${SummaryApi.locations_villages.url}` +
          `?state=${encodeURIComponent(stateVal)}` +
          `&district=${encodeURIComponent(district)}` +
          `&talukName=${encodeURIComponent(city)}`;

        const res = await fetch(url, { headers });
        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          let raw = json.data.map((v: any) => {
            if (typeof v === "string") return v;
            if (v && typeof v === "object")
              return v.village || v.villageName || v.name || "";
            return "";
          });
          let list = raw.filter((x: string) => x.trim().length > 0);

          // ✅ keep custom village too
          if (area && !list.includes(area)) {
            list = [area, ...list];
          }

          setVillageOptions(list);
        }
      } catch (err) {
        console.log("Error loading villages:", err);
      }
    };

    loadVillages();
  }, [stateVal, district, city, area, token]);

  // ------------------ SAVE ------------------
  const doSave = async () => {
    if (profileLocked) {
      Alert.alert(
        "Profile locked",
        "Your profile is verified by admin. Address editing is disabled."
      );
      return;
    }

    if (!street || !district || !city || !area || !stateVal || !pincode) {
      Alert.alert("Missing fields", "Please fill all fields.");
      return;
    }

    try {
      setSaving(true);

      const form = new FormData();
      form.append(
        "address",
        JSON.stringify({
          street,
          area,
          city,
          district,
          state: stateVal,
          pincode,
        })
      );

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${baseURL}${SummaryApi.user_update_profile.url}`, {
        method: SummaryApi.user_update_profile.method,
        headers,
        body: form,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        Alert.alert("Error", data.message || "Failed to update address");
        return;
      }

      const updatedUser = data.user || data.data;
      if (updatedUser) {
        await setAuth(updatedUser, token!);
      }
      await refreshUser();

      Alert.alert("Address saved", "Your address has been updated successfully.", [
        { text: "OK", onPress: () => router.replace("/Profile") },
      ]);
    } catch (err: any) {
      console.log("Address update error:", err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const onPressSave = () => {
    if (profileLocked) {
      Alert.alert(
        "Profile locked",
        "Your profile is verified by admin. Address editing is disabled."
      );
      return;
    }

    Alert.alert("Save address", "Do you want to save/update your address?", [
      { text: "Cancel", style: "cancel" },
      { text: "Save", onPress: doSave },
    ]);
  };

  const renderInput = (
    label: string,
    value: string,
    setter: (t: string) => void,
    placeholder?: string,
    forceDisabled?: boolean
  ) => {
    const disabled = !!forceDisabled;

    return (
      <View className="mb-4">
        <Text className="mb-1 text-[11px] font-medium text-slate-600">{label}</Text>
        <TextInput
          value={value}
          onChangeText={setter}
          placeholder={placeholder}
          editable={!disabled}
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          autoCapitalize="sentences"
          className={`h-11 rounded-xl border px-3 text-sm ${
            disabled
              ? "border-slate-200 bg-slate-100 text-slate-400"
              : "border-blue-200 bg-white text-slate-900"
          }`}
        />
      </View>
    );
  };

  const renderDropdown = (
    label: string,
    value: string,
    setter: (t: string) => void,
    placeholder: string,
    show: boolean,
    setShow: (b: boolean) => void,
    search: string,
    setSearch: (t: string) => void,
    options: string[],
    allowCustomAdd: boolean = false,
    forceDisabled?: boolean
  ) => {
    const disabled = !!forceDisabled;

    const filtered = options.filter((opt) =>
      opt.toLowerCase().includes(search.toLowerCase())
    );

    const trimmed = search.trim();

    const canAddCustom =
      allowCustomAdd &&
      trimmed.length > 0 &&
      !options.some((o) => o.toLowerCase() === trimmed.toLowerCase());

    return (
      <View className="mb-4">
        <Text className="mb-1 text-[11px] font-medium text-slate-600">{label}</Text>

        <TouchableOpacity
          disabled={disabled}
          onPress={() => !disabled && setShow(!show)}
          className={`h-11 flex-row items-center justify-between rounded-xl border px-3 ${
            disabled ? "border-slate-200 bg-slate-100" : "border-blue-200 bg-white"
          }`}
        >
          <Text className={`text-sm ${value ? "text-slate-900" : "text-slate-400"}`}>
            {value || placeholder}
          </Text>
          <Ionicons
            name={show ? "chevron-up" : "chevron-down"}
            size={18}
            color={disabled ? "#9CA3AF" : "#2563EB"}
          />
        </TouchableOpacity>

        {show && !disabled && (
          <View className="mt-2 rounded-2xl border border-blue-100 bg-white shadow-md">
            <View className="px-3 pt-2 pb-1">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={`Search ${label.toLowerCase()}...`}
                placeholderTextColor="#4B5563"
                autoCorrect={false}
                autoCapitalize="none"
                className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100/80 px-3 text-[14px] text-black font-semibold"
              />
            </View>

            <ScrollView
              style={{ maxHeight: 200 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {filtered.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    setter(opt);
                    setShow(false);
                    setSearch("");
                  }}
                  className="px-3 py-2 border-t border-slate-100"
                >
                  <Text className="text-sm text-slate-800">{opt}</Text>
                </TouchableOpacity>
              ))}

              {/* ✅ Custom add button even if results exist */}
              {canAddCustom && (
                <TouchableOpacity
                  onPress={() => {
                    const customName = trimmed;
                    setter(customName);
                    setShow(false);
                    setSearch("");
                  }}
                  className="px-3 py-3 border-t border-slate-100 bg-blue-50"
                >
                  <Text className="text-xs font-semibold text-blue-800">
                    {trimmed}
                  </Text>
                </TouchableOpacity>
              )}

              {filtered.length === 0 && !canAddCustom && (
                <View className="px-3 py-3">
                  <Text className="text-xs text-slate-600">No results found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const role = (user?.role as "OWNER" | "EMPLOYEE" | "USER") || "USER";
  const profilePercent = user?.profilePercent ?? 0;
  const isVerified = !!user?.isProfileVerified;
  const qrCodeUrl = (user as any)?.qrCodeUrl;
  const shopCompleted = !!(user as any)?.shopCompleted;

  if (loading || !user || !token) {
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

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <View className="px-5 pt-4 pb-5 bg-white rounded-b-3xl shadow-md shadow-slate-900/20">
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
                  Update address
                </Text>
                <Text className="text-[11px] text-slate-500">
                  Communication address
                </Text>
              </View>
            </View>

            <View className="rounded-full bg-blue-50 px-3 py-[4px]">
              <Text className="text-[11px] font-semibold text-blue-700">
                Profile
              </Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 300,
            }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {/* 🔒 Lock banner */}
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
                    Your profile is verified by admin. Editing is locked.
                  </Text>
                </View>
              </View>
            )}

            <View className="-mt-15 mb-4 flex-row items-center rounded-2xl border border-blue-100 bg-white px-3 py-3 shadow-[0px_2px_8px_rgba(37,99,235,0.18)]">
              <View className="mr-3 rounded-full bg-blue-50 p-2">
                <Ionicons name="home-outline" size={20} color="#1D4ED8" />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold text-slate-900">
                  Update address
                </Text>
                <Text className="mt-1 text-[11px] text-slate-500">
                  You can update your communication address anytime.
                </Text>
              </View>
            </View>

            <View className="rounded-3xl border border-blue-100 bg-white px-4 py-5 shadow-[0px_2px_10px_rgba(37,99,235,0.22)]">
              {renderDropdown(
                "State",
                stateVal,
                (val) => {
                  setStateVal(val);
                  setDistrict("");
                  setCity("");
                  setTalukOptions([]);
                  setArea("");
                  setVillageOptions([]);
                },
                "Select state",
                showStateDropdown,
                setShowStateDropdown,
                stateSearch,
                setStateSearch,
                stateOptions,
                false,
                profileLocked
              )}

              {renderDropdown(
                "District",
                district,
                (val) => {
                  setDistrict(val);
                  setCity("");
                  setTalukOptions([]);
                  setArea("");
                  setVillageOptions([]);
                },
                "Select district",
                showDistrictDropdown,
                setShowDistrictDropdown,
                districtSearch,
                setDistrictSearch,
                districtOptions,
                false,
                profileLocked
              )}

              {renderDropdown(
                "Taluk",
                city,
                (val) => {
                  setCity(val);
                  setArea("");
                  setVillageOptions([]);
                },
                "Select taluk",
                showTalukDropdown,
                setShowTalukDropdown,
                talukSearch,
                setTalukSearch,
                talukOptions,
                true,
                profileLocked
              )}

              {renderDropdown(
                "Village",
                area,
                setArea,
                "Select village",
                showVillageDropdown,
                setShowVillageDropdown,
                villageSearch,
                setVillageSearch,
                villageOptions,
                true,
                profileLocked
              )}

              {renderInput(
                "Street / Door no.",
                street,
                setStreet,
                "Door number",
                profileLocked
              )}
              {renderInput("Pincode", pincode, setPincode, "Pincode", profileLocked)}
            </View>

            <View className="mt-4">
              <TouchableOpacity
                disabled={saving || profileLocked}
                onPress={profileLocked ? undefined : onPressSave}
                className={`h-12 w-full items-center justify-center rounded-full shadow-lg shadow-blue-300/60 ${
                  profileLocked
                    ? "bg-slate-400"
                    : saving
                    ? "bg-blue-400/70"
                    : "bg-blue-600"
                }`}
              >
                {saving ? (
                  <ActivityIndicator color="#E0F2FE" />
                ) : (
                  <Text className="text-sm font-semibold text-blue-50">
                    {profileLocked ? "Profile locked" : "Save address"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

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
