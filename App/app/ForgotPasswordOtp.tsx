// app/ForgotPasswordOtp.tsx
import React, { useEffect, useRef, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import SummaryApi, { baseURL } from "../constants/SummaryApi";

const otpImage = require("../assets/images/Enter-OTP.png");

type ToastType = "success" | "error";

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message: string;
}

export default function ForgotPasswordOtp() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [loading, setLoading] = useState(false);

  // 10 minutes = 600 seconds
  const [timer, setTimer] = useState(600);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
      .toString()
      .padStart(2, "0");
    const s = (t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const showToast = (type: ToastType, title: string, message: string) => {
    setToast({ visible: true, type, title, message });
    setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      2500
    );
  };

  /* ------------------- Timer Countdown ------------------- */
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  /* -------------------- Handle OTP Input -------------------- */
  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otpCode = otp.join("");

  /* ---------------------- Submit OTP ---------------------- */
  const handleSubmit = async () => {
    if (otpCode.length !== 6) {
      showToast("error", "Invalid OTP", "Please enter all 6 digits.");
      return;
    }

    try {
      setLoading(true);

      // ✅ verify OTP on backend
      const { method, url } = SummaryApi.verify_forgot_password_otp;
      const res = await fetch(`${baseURL}${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(
          "error",
          "Invalid OTP",
          data?.message || "OTP is incorrect or expired."
        );
        return;
      }

      showToast("success", "Verified", "OTP verified successfully.");

      router.push({
        pathname: "/ResetPassword",
        params: { email, otp: otpCode },
      });
    } catch {
      showToast("error", "Error", "Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- Resend OTP ---------------------- */
  const handleResend = async () => {
    if (timer > 0) return;

    try {
      const { method, url } = SummaryApi.forgot_password_otp;

      await fetch(`${baseURL}${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      showToast("success", "OTP Sent", "A new OTP has been sent.");
      setTimer(600); // back to 10 minutes
    } catch {
      showToast("error", "Error", "Failed to resend OTP.");
    }
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
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 px-5 py-6 mt-2">
               {/* Card */}
              <View className="flex-1 rounded-3xl bg-white px-5 py-6 shadow-lg mt-2">
                {/* Illustration */}
                <View className="items-center mb-5">
                  <Image
                    source={otpImage}
                    className="w-[230px] h-[230px]"
                    resizeMode="contain"
                  />
                </View>

                {/* Title + description */}
                <Text className="text-center text-[22px] font-bold text-slate-900">
                  Enter Verification Code
                </Text>

                <Text className="mt-2 text-center text-[13px] text-slate-500">
                  Code sent to{" "}
                  <Text className="font-semibold text-slate-900">
                    {email}
                  </Text>
                </Text>

                <Text className="mt-1 mb-5 text-center text-[12px] text-slate-400">
                  Enter the 6-digit code to continue.
                </Text>

                {/* OTP boxes */}
                <View className="mb-5 flex-row justify-between">
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(v) => handleChange(v, index)}
                      className="w-12 h-14 rounded-2xl border text-center text-xl font-semibold bg-slate-50"
                      style={{
                        borderColor: digit ? "#2563EB" : "#E5E7EB",
                        shadowColor: "#000",
                        shadowOpacity: digit ? 0.08 : 0,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 6,
                        elevation: digit ? 3 : 0,
                      }}
                    />
                  ))}
                </View>

                {/* Timer + resend */}
                <View className="mb-3 flex-row items-center justify-center">
                  <Text className="text-[12px] text-slate-500">
                    Didn’t receive code?
                  </Text>
                  <TouchableOpacity
                    disabled={timer > 0}
                    onPress={handleResend}
                  >
                    <Text
                      className="ml-1 text-[12px] font-semibold"
                      style={{
                        color: timer > 0 ? "#9CA3AF" : "#2563EB",
                      }}
                    >
                      {timer > 0
                        ? `Resend in ${formatTime(timer)}`
                        : "Resend OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Next button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  className="mt-1"
                >
                  <LinearGradient
                    colors={["#2563EB", "#1D4ED8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="items-center justify-center rounded-full py-3"
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-[15px] font-bold text-white">
                        Next
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Toast */}
              {toast.visible && (
                <View className="absolute bottom-7 left-5 right-5 flex-row items-start rounded-2xl border px-4 py-3"
                  style={{
                    backgroundColor:
                      toast.type === "success" ? "#DCFCE7" : "#FEE2E2",
                    borderColor:
                      toast.type === "success" ? "#22C55E" : "#EF4444",
                  }}
                >
                  <Ionicons
                    name={
                      toast.type === "success"
                        ? "checkmark-circle-outline"
                        : "alert-circle-outline"
                    }
                    size={20}
                    color={toast.type === "success" ? "#16A34A" : "#B91C1C"}
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <View className="flex-1">
                    <Text
                      className="text-[13px] font-semibold"
                      style={{
                        color:
                          toast.type === "success" ? "#166534" : "#B91C1C",
                      }}
                    >
                      {toast.title}
                    </Text>
                    <Text
                      className="mt-0.5 text-[12px]"
                      style={{
                        color:
                          toast.type === "success" ? "#166534" : "#B91C1C",
                      }}
                    >
                      {toast.message}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
