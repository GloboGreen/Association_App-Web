// app/Signup.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SummaryApi, { baseURL } from "../constants/SummaryApi";
import { Ionicons } from "@expo/vector-icons";

type ToastType = "success" | "error";

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message: string;
}

interface Association {
  _id: string;
  name: string;
  district?: string;
  area?: string;
}

interface FieldErrors {
  name?: string;
  mobile?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  district?: string;
  association?: string;
  shopName?: string;
}

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessType, setBusinessType] = useState<"RETAIL" | "WHOLESALE">(
    "RETAIL"
  );
  const [loading, setLoading] = useState(false);

  // Association + district dropdown
  const [associations, setAssociations] = useState<Association[]>([]);
  const [assocLoading, setAssocLoading] = useState(false);

  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);

  const [selectedAssociationId, setSelectedAssociationId] = useState("");
  const [isAssocOpen, setIsAssocOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showConfirmSecret, setShowConfirmSecret] = useState(false);

  // shop name
  const [shopName, setShopName] = useState("");

  // validation errors
  const [errors, setErrors] = useState<FieldErrors>({});

  // toast
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 2800);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  const showToast = (type: ToastType, title: string, message: string) => {
    setToast({ visible: true, type, title, message });
  };

  // Fetch associations
  useEffect(() => {
    const load = async () => {
      try {
        setAssocLoading(true);

        const res = await fetch(`${baseURL}${SummaryApi.associations.url}`);
        const data = await res.json();

        const list: Association[] =
          data.associations || data.data || data || [];

        setAssociations(list);
      } catch (err) {
        showToast("error", "Error", "Unable to load associations.");
      } finally {
        setAssocLoading(false);
      }
    };

    load();
  }, []);

  // Unique district list from associations
  const districts = Array.from(
    new Set(
      associations
        .map((a) => a.district)
        .filter((d): d is string => !!d && d.trim().length > 0)
    )
  );

  // Associations filtered by selected district
  const filteredAssociations = selectedDistrict
    ? associations.filter((a) => a.district === selectedDistrict)
    : associations;

  const mobileRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ✅ FORM VALIDATION
  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};

    // Name
    if (!name.trim()) {
      newErrors.name = "Full name is required.";
    }

    // Mobile (required + format)
    if (!mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
    } else if (!mobileRegex.test(mobile)) {
      newErrors.mobile = "Enter a valid 10-digit Indian mobile number.";
    }

    // Email (required + format)
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    // Password (required, min 6 chars)
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }


    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    // District
    if (!selectedDistrict) {
      newErrors.district = "District is required.";
    }

    // Association
    if (!selectedAssociationId) {
      newErrors.association = "Association name is required.";
    }

    // Shop name
    if (!shopName.trim()) {
      newErrors.shopName = "Shop name is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0] as keyof FieldErrors;
      const firstMessage = newErrors[firstKey] || "Please fix the highlighted fields.";
      showToast("error", "Validation Error", firstMessage);
      return false;
    }

    return true;
  };

  // Signup
  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${baseURL}${SummaryApi.register.url}`, {
        method: SummaryApi.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile,
          email,
          password,
          additionalNumber: mobile,
          BusinessType: businessType,
          associationId: selectedAssociationId,
          shopName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast("error", "Signup Failed", data.message || "Try again.");
        return;
      }

      showToast(
        "success",
        "Account Created",
        "OTP sent to your email for verification."
      );

      setTimeout(() => {
        router.push({
          pathname: "/VerifyEmailOtp",
          params: { email },
        });
      }, 1200);
    } catch (err) {
      showToast("error", "Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F5F9]">
      {/* Top gradient header */}
      <LinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute top-0 left-0 right-0 h-64"
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{
            paddingBottom: 300,
            paddingTop: 12,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top row: back + login link */}
          <View className="flex-row items-center justify-between mb-6 mt-2">
            <TouchableOpacity onPress={() => router.replace("/Login")}>
              <Text className="text-xs font-semibold text-white/90">← Back</Text>
            </TouchableOpacity>


            <TouchableOpacity onPress={() => router.push("/Login")}>
              <Text className="text-[11px] text-white/90">
                Already have an account?{" "}
                <Text className="font-semibold underline">Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View className="mt-3 mb-4">
            <Text className="text-2xl font-bold text-white text-center">
              Get started
            </Text>
          </View>

          {/* White card */}
          <View className="mt-4 w-full rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.25)]">
            {/* label */}
            <Text className="mb-4 text-[11px] font-semibold uppercase tracking-[3px] text-slate-400">
              TN Tech Connect
            </Text>

            {/* Full Name */}
            <View className="mb-4">
              <Text
                className={`mb-1 text-xs ${errors.name ? "text-red-600" : "text-slate-700"
                  }`}
              >
                Full Name
              </Text>
              <TextInput
                className={`h-11 rounded-xl border bg-white px-3 text-sm text-slate-900 ${errors.name ? "border-red-400" : "border-slate-200"
                  }`}
                placeholder="Your full name"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
              />
              {errors.name && (
                <Text className="mt-1 text-[10px] text-red-500">
                  {errors.name}
                </Text>
              )}
            </View>

            {/* Mobile */}
            <View className="mb-4">
              <Text
                className={`mb-1 text-xs ${errors.mobile ? "text-red-600" : "text-slate-700"
                  }`}
              >
                Primary Mobile Number (WhatsApp)
              </Text>
              <TextInput
                className={`h-11 rounded-xl border bg-white px-3 text-sm text-slate-900 ${errors.mobile ? "border-red-400" : "border-slate-200"
                  }`}
                placeholder="98765 43210"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={(text) => {
                  const onlyDigits = text.replace(/[^0-9]/g, "");
                  setMobile(onlyDigits);
                  if (errors.mobile) {
                    setErrors((prev) => ({ ...prev, mobile: undefined }));
                  }
                }}
              />
              {errors.mobile && (
                <Text className="mt-1 text-[10px] text-red-500">
                  {errors.mobile}
                </Text>
              )}
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text
                className={`mb-1 text-xs ${errors.email ? "text-red-600" : "text-slate-700"
                  }`}
              >
                Email
              </Text>
              <TextInput
                className={`h-11 rounded-xl border bg-white px-3 text-sm text-slate-900 ${errors.email ? "border-red-400" : "border-slate-200"
                  }`}
                placeholder="you@example.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
              />
              {errors.email && (
                <Text className="mt-1 text-[10px] text-red-500">
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Business Type */}
            <View className="flex-row gap-3 mb-4">
              {/* RETAIL */}
              <TouchableOpacity
                onPress={() => setBusinessType("RETAIL")}
                className={`flex-1 h-11 rounded-xl items-center justify-center border ${businessType === "RETAIL"
                  ? "border-[#4F46E5] overflow-hidden"
                  : "bg-slate-100 border-slate-300"
                  }`}
              >
                {businessType === "RETAIL" ? (
                  <LinearGradient
                    colors={["#2563EB", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute left-0 top-0 h-full w-full rounded-xl"
                  />
                ) : null}

                <Text
                  className={`text-xs font-semibold ${businessType === "RETAIL"
                    ? "text-white"
                    : "text-slate-700"
                    }`}
                >
                  Retail
                </Text>
              </TouchableOpacity>

              {/* WHOLESALE */}
              <TouchableOpacity
                onPress={() => setBusinessType("WHOLESALE")}
                className={`flex-1 h-11 rounded-xl items-center justify-center border ${businessType === "WHOLESALE"
                  ? "border-[#4F46E5] overflow-hidden"
                  : "bg-slate-100 border-slate-300"
                  }`}
              >
                {businessType === "WHOLESALE" ? (
                  <LinearGradient
                    colors={["#2563EB", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute left-0 top-0 h-full w-full rounded-xl"
                  />
                ) : null}

                <Text
                  className={`text-xs font-semibold ${businessType === "WHOLESALE"
                    ? "text-white"
                    : "text-slate-700"
                    }`}
                >
                  Wholesale
                </Text>
              </TouchableOpacity>
            </View>

            {/* District + Association row */}
            <View className="mb-4">
              <Text className="mb-1 text-xs text-slate-700">Association</Text>
              <View className="flex-row gap-3">
                {/* District (left) */}
                <View className="flex-1">
                  <Text
                    className={`mb-1 text-xs ${errors.district ? "text-red-600" : "text-slate-700"
                      }`}
                  >
                    District
                  </Text>
                  {assocLoading ? (
                    <ActivityIndicator color="#4F46E5" />
                  ) : (
                    <>
                      <TouchableOpacity
                        className={`h-11 rounded-xl px-3 flex-row items-center justify-between border bg-white ${errors.district
                          ? "border-red-400"
                          : "border-slate-200"
                          }`}
                        onPress={() => {
                          setIsDistrictOpen((p) => !p);
                          setIsAssocOpen(false);
                        }}
                      >
                        <Text
                          className={`text-xs ${selectedDistrict
                            ? "text-slate-900"
                            : "text-slate-400"
                            }`}
                        >
                          {selectedDistrict || "Select district"}
                        </Text>
                        <Text className="text-[10px] text-slate-500">
                          {isDistrictOpen ? "▲" : "▼"}
                        </Text>
                      </TouchableOpacity>

                      {errors.district && (
                        <Text className="mt-1 text-[10px] text-red-500">
                          {errors.district}
                        </Text>
                      )}

                      {isDistrictOpen && (
                        <View className="mt-1 max-h-40 rounded-xl border border-slate-200 bg-white">
                          <ScrollView keyboardShouldPersistTaps="handled">
                            {districts.map((district) => {
                              const selected = district === selectedDistrict;
                              return (
                                <TouchableOpacity
                                  key={district}
                                  className={`px-3 py-2 border-b border-slate-100 ${selected ? "bg-emerald-50" : ""
                                    }`}
                                  onPress={() => {
                                    setSelectedDistrict(district);
                                    setSelectedAssociationId("");
                                    setIsDistrictOpen(false);
                                    if (errors.district) {
                                      setErrors((prev) => ({
                                        ...prev,
                                        district: undefined,
                                      }));
                                    }
                                  }}
                                >
                                  <Text
                                    className={`text-xs ${selected
                                      ? "text-emerald-700"
                                      : "text-slate-700"
                                      }`}
                                  >
                                    {district}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {/* Association Name (right) */}
                <View className="flex-1">
                  <Text
                    className={`mb-1 text-xs ${errors.association ? "text-red-600" : "text-slate-700"
                      }`}
                  >
                    Association Name
                  </Text>
                  {assocLoading ? (
                    <ActivityIndicator color="#4F46E5" />
                  ) : (
                    <>
                      <TouchableOpacity
                        className={`h-11 rounded-xl px-3 flex-row items-center justify-between border bg-white ${errors.association
                          ? "border-red-400"
                          : "border-slate-200"
                          }`}
                        onPress={() => {
                          if (!selectedDistrict) {
                            showToast(
                              "error",
                              "Select District",
                              "Please select district first."
                            );
                            return;
                          }
                          setIsAssocOpen((p) => !p);
                          setIsDistrictOpen(false);
                        }}
                      >
                        <Text
                          className={`text-xs ${selectedAssociationId
                            ? "text-slate-900"
                            : "text-slate-400"
                            }`}
                        >
                          {selectedAssociationId
                            ? filteredAssociations.find(
                              (a) => a._id === selectedAssociationId
                            )?.name
                            : "Select association"}
                        </Text>
                        <Text className="text-[10px] text-slate-500">
                          {isAssocOpen ? "▲" : "▼"}
                        </Text>
                      </TouchableOpacity>

                      {errors.association && (
                        <Text className="mt-1 text-[10px] text-red-500">
                          {errors.association}
                        </Text>
                      )}

                      {isAssocOpen && (
                        <View className="mt-1 max-h-40 rounded-xl border border-slate-200 bg-white">
                          <ScrollView keyboardShouldPersistTaps="handled">
                            {filteredAssociations.map((assoc) => {
                              const selected =
                                assoc._id === selectedAssociationId;
                              return (
                                <TouchableOpacity
                                  key={assoc._id}
                                  className={`px-3 py-2 border-b border-slate-100 ${selected ? "bg-emerald-50" : ""
                                    }`}
                                  onPress={() => {
                                    setSelectedAssociationId(assoc._id);
                                    setIsAssocOpen(false);
                                    if (errors.association) {
                                      setErrors((prev) => ({
                                        ...prev,
                                        association: undefined,
                                      }));
                                    }
                                  }}
                                >
                                  <Text
                                    className={`text-xs ${selected
                                      ? "text-emerald-700"
                                      : "text-slate-700"
                                      }`}
                                  >
                                    {assoc.name}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Shop Name */}
            <View className="mb-4">
              <Text
                className={`mb-1 text-xs ${errors.shopName ? "text-red-600" : "text-slate-700"
                  }`}
              >
                Shop Name
              </Text>
              <TextInput
                className={`h-11 rounded-xl border bg-white px-3 text-sm text-slate-900 ${errors.shopName ? "border-red-400" : "border-slate-200"
                  }`}
                placeholder="Your shop name"
                placeholderTextColor="#94a3b8"
                value={shopName}
                onChangeText={(text) => {
                  setShopName(text);
                  if (errors.shopName) {
                    setErrors((prev) => ({ ...prev, shopName: undefined }));
                  }
                }}
              />
              {errors.shopName && (
                <Text className="mt-1 text-[10px] text-red-500">
                  {errors.shopName}
                </Text>
              )}
            </View>

            {/* Password */}
            <View className="mb-4">
              <Text
                className={`mb-1 text-xs ${errors.password ? "text-red-600" : "text-slate-700"
                  }`}
              >
                Password
              </Text>

              <View className="relative">
                <TextInput
                  className={`h-11 rounded-xl border bg-white px-3 pr-10 text-sm text-slate-900 ${errors.password ? "border-red-400" : "border-slate-200"
                    }`}
                  placeholder="Choose a strong password (min 6 characters)"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showSecret}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                />

                <TouchableOpacity
                  onPress={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-3"
                >
                  <Ionicons
                    name={showSecret ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="mt-1 text-[10px] text-red-500">
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text
                className={`mb-1 text-xs ${errors.confirmPassword ? "text-red-600" : "text-slate-700"
                  }`}
              >
                Confirm Password
              </Text>

              <View className="relative">
                <TextInput
                  className={`h-11 rounded-xl border bg-white px-3 pr-10 text-sm text-slate-900 ${errors.confirmPassword
                    ? "border-red-400"
                    : "border-slate-200"
                    }`}
                  placeholder="Re-enter password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmSecret}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                    }
                  }}
                />

                <TouchableOpacity
                  onPress={() => setShowConfirmSecret(!showConfirmSecret)}
                  className="absolute right-3 top-3"
                >
                  <Ionicons
                    name={showConfirmSecret ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text className="mt-1 text-[10px] text-red-500">
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            {/* Button */}
            <View className="px-2">
              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={
                    loading ? ["#6B7280", "#6B7280"] : ["#2563EB", "#EC4899"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="h-12 w-full rounded-full items-center justify-center"
                >
                  {loading ? (
                    <ActivityIndicator color="#EEF2FF" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">
                      Create Account
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      {toast.visible && (
        <View
          className={`absolute bottom-6 mx-4 rounded-xl px-4 py-3 shadow-lg ${toast.type === "success"
            ? "bg-emerald-500/95"
            : "bg-red-500/95"
            }`}
        >
          <Text className="text-xs font-bold text-white">{toast.title}</Text>
          <Text className="mt-1 text-[11px] text-white/90">
            {toast.message}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
