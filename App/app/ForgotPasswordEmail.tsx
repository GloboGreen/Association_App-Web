// app/ForgotPasswordEmail.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SummaryApi, { baseURL } from "../constants/SummaryApi";

const forgotPasswordImage = require("../assets/images/Forgot-password.png");

type ToastType = "success" | "error";

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message: string;
}

export default function ForgotPasswordEmail() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const showToast = (type: ToastType, title: string, message: string) => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return "Please enter a valid email.";
    return null;
  };

  const handleContinue = async () => {
    const error = validateEmail(email);
    setFieldError(error);
    if (error) return;

    try {
      setLoading(true);

      const { method, url } = SummaryApi.forgot_password_otp;

      const response = await fetch(`${baseURL}${url}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg =
          data?.message ||
          data?.error ||
          "Failed to send password reset OTP. Try again.";
        showToast("error", "Error", msg);
        return;
      }

      showToast(
        "success",
        "OTP sent",
        "We have sent a password reset OTP to your email."
      );

      router.push({
        pathname: "/ForgotPasswordOtp",
        params: { email: email.trim() },
      });
    } catch (err) {
      console.error("Forgot password error:", err);
      showToast(
        "error",
        "Network error",
        "Unable to send OTP. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace("/Login");
  };

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            className="px-5 py-6"
          >
            {/* Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-4 self-start"
            >
              <View className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-md shadow-black/10">
                <Ionicons name="chevron-back" size={18} color="#111827" />
              </View>
            </TouchableOpacity>

            {/* Card */}
            <View className="flex-1 bg-white rounded-3xl px-5 py-6 shadow-lg shadow-black/10">
              {/* Illustration */}
              <View className="items-center mb-6">
                <Image
                  source={forgotPasswordImage}
                  className="w-36 h-36"
                  style={{ resizeMode: "contain" }}
                />
              </View>

              {/* Title */}
              <Text className="text-[22px] font-bold text-center text-slate-900">
                Forgot Password
              </Text>
              <Text className="mt-2 mb-6 text-sm text-center text-slate-500">
                Please enter your email address to reset your password.
              </Text>

              {/* Email label */}
              <Text className="mb-1.5 text-[13px] font-medium text-slate-700">
                Email address
              </Text>

              {/* Email input */}
              <View
                className={`flex-row items-center rounded-full border px-3.5 py-2.5 bg-slate-50 ${
                  fieldError ? "border-red-500" : "border-slate-200"
                }`}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={fieldError ? "#EF4444" : "#9CA3AF"}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="Enter your email address..."
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (fieldError) setFieldError(null);
                  }}
                  className="flex-1 text-[14px] text-slate-900 py-1"
                />
              </View>

              {fieldError && (
                <Text className="mt-1.5 text-[12px] text-red-500">
                  {fieldError}
                </Text>
              )}

              {/* Continue button */}
              <TouchableOpacity
                onPress={handleContinue}
                disabled={loading}
                className="mt-6"
              >
                <LinearGradient
                  colors={["#22C55E", "#16A34A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-full py-3 items-center justify-center"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-[15px] font-semibold text-white">
                      Continue
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Help + back */}
              <View className="mt-5 items-center">
                <Text className="text-[12px] text-slate-500 text-center">
                  Don’t remember your email? Contact your association admin.
                </Text>

                <TouchableOpacity
                  onPress={handleBackToLogin}
                  className="mt-3"
                >
                  <Text className="text-[13px] font-semibold text-emerald-600">
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Toast */}
            {toast.visible && (
              <View className="absolute left-5 right-5 bottom-6 flex-row items-start rounded-2xl border px-3.5 py-3 bg-white/90">
                <Ionicons
                  name={
                    toast.type === "success"
                      ? "checkmark-circle-outline"
                      : "alert-circle-outline"
                  }
                  size={20}
                  color={toast.type === "success" ? "#16A34A" : "#DC2626"}
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <View className="flex-1">
                  <Text
                    className={`text-[13px] font-semibold ${
                      toast.type === "success"
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    {toast.title}
                  </Text>
                  <Text
                    className={`mt-0.5 text-[12px] ${
                      toast.type === "success"
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    {toast.message}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
