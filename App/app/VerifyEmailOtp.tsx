// app/VerifyEmailOtp.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SummaryApi, { baseURL } from "../constants/SummaryApi";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "./context/AuthContext";

type ToastType = "success" | "error";

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message: string;
}

const OTP_LENGTH = 6;

export default function VerifyEmailOtp() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    origin?: string;
    identifier?: string;
    password?: string;
  }>();

  const email = (params.email as string) || "";
  const origin = (params.origin as string) || "signup"; // "signup" | "login"
  const loginIdentifier = (params.identifier as string) || "";
  const loginPassword = (params.password as string) || "";

  const { setAuth } = useAuth();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);

  // Properly typed ref array
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  /* ---------- toast ---------- */
  useEffect(() => {
    if (!toast.visible) return;
    const t = setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      2500
    );
    return () => clearTimeout(t);
  }, [toast.visible]);

  const showToast = (type: ToastType, title: string, message: string) => {
    setToast({ visible: true, type, title, message });
  };

  /* ---------- resend timer ---------- */
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = setInterval(
      () => setResendSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000
    );
    return () => clearInterval(id);
  }, [resendSeconds]);

  /* ---------- OTP handlers ---------- */
  const handleChange = (value: string, index: number) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    const next = [...otp];
    next[index] = cleaned.slice(-1);
    setOtp(next);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const code = otp.join("");

  /* ---------- helper: auto-login after OTP (from Login flow) ---------- */
  const autoLoginAfterVerification = async () => {
    if (!loginIdentifier || !loginPassword) {
      // No credentials available → fall back to Login screen
      router.replace("/Login");
      return;
    }

    try {
      const payload: any = {};
      const trimmedIdentifier = loginIdentifier.trim();
      const isEmail = trimmedIdentifier.includes("@");

      if (isEmail) {
        payload.email = trimmedIdentifier;
      } else {
        payload.mobile = trimmedIdentifier;
      }
      payload.password = loginPassword;

      const url = `${baseURL}${SummaryApi.login.url}`;
      console.log("🔐 Auto-login after OTP →", url, payload);

      const res = await fetch(url, {
        method: SummaryApi.login.method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      console.log("🔍 Raw auto-login response:", raw);

      let data: any = null;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        console.log("❌ Failed to parse auto-login JSON:", parseErr);
        showToast(
          "error",
          "Login error",
          "OTP verified, but login failed. Please login again."
        );
        router.replace("/Login");
        return;
      }

      if (!res.ok || !data?.success || !data.accessToken || !data.user) {
        showToast(
          "error",
          "Login error",
          data?.message || "OTP verified, but login failed. Please login again."
        );
        router.replace("/Login");
        return;
      }

      const userFromApi = data.user;
      await setAuth(userFromApi, data.accessToken);

      const role = userFromApi.role || "OWNER";
      const shopCompleted = !!userFromApi.shopCompleted;

      const firstScreen =
        role === "OWNER" ? (shopCompleted ? "/Home" : "/Shop") : "/Home";

      console.log("➡️ Redirecting after OTP to:", firstScreen, {
        role,
        shopCompleted,
      });

      router.replace(firstScreen);
    } catch (err) {
      console.log("❌ Auto-login error after OTP:", err);
      showToast(
        "error",
        "Login error",
        "OTP verified, but something went wrong. Please login again."
      );
      router.replace("/Login");
    }
  };

  /* ---------- submit ---------- */
  const handleSubmit = async () => {
    if (!email) {
      showToast(
        "error",
        "Email missing",
        "Email not found. Please signup again."
      );
      return;
    }

    if (code.length !== OTP_LENGTH) {
      showToast(
        "error",
        "Invalid OTP",
        `Please enter the ${OTP_LENGTH}-digit OTP.`
      );
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      const res = await fetch(`${baseURL}${SummaryApi.verify_email_otp.url}`, {
        method: SummaryApi.verify_email_otp.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(
          "error",
          "Verification failed",
          data.message || "Incorrect or expired OTP."
        );
        return;
      }

      showToast(
        "success",
        "Email verified",
        data.message || "Your email has been successfully verified."
      );

      // 🔹 If we came from LOGIN, auto-login and go Home/Shop
      if (origin === "login") {
        await autoLoginAfterVerification();
        return;
      }

      // 🔹 Default (from SIGNUP): go to Login screen
      setTimeout(() => {
        router.replace("/Login");
      }, 1000);
    } catch (err) {
      console.log("verify otp error:", err);
      showToast(
        "error",
        "Error",
        "Something went wrong while verifying. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------- resend ---------- */
  const resendOtp = async () => {
    if (!email || resendSeconds > 0) return;

    try {
      setLoading(true);
      const res = await fetch(
        `${baseURL}${SummaryApi.send_verify_email_otp.url}`,
        {
          method: SummaryApi.send_verify_email_otp.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast("error", "Failed", data.message || "Unable to resend OTP.");
        return;
      }

      showToast(
        "success",
        "OTP resent",
        data.message || "New OTP sent to your email."
      );
      setOtp(Array(OTP_LENGTH).fill(""));
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
      setResendSeconds(60);
    } catch (e) {
      console.log("resend otp error:", e);
      showToast("error", "Error", "Unable to resend OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const formattedTimer = `00:${resendSeconds.toString().padStart(2, "0")}`;

  /* ================= UI ================= */
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        {/* Back + Centered Title */}
        <View className="mt-3 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            className="flex-1"
          >
            <Text className="text-xl text-neutral-900">‹</Text>
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text className="text-2xl font-semibold text-neutral-900">
              Verify
            </Text>
          </View>

          {/* right side empty box to keep center alignment */}
          <View className="flex-1" />
        </View>

        {/* Illustration */}
        <View className="items-center">
          <Image
            source={require("../assets/images/verify.png")}
            resizeMode="contain"
            style={{ width: 300, height: 300 }}
          />
        </View>

        {/* Text block */}
        <View className="mt-1 items-center">
          <Text className="mt-1 text-base font-semibold text-neutral-900">
            Enter OTP
          </Text>

          <Text className="mt-2 text-xs text-neutral-500 text-center">
            A {OTP_LENGTH}-digit OTP has been sent to {email}
          </Text>
        </View>

        {/* OTP boxes */}
        <View className="mt-2 flex-row items-center justify-between px-3">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref: TextInput | null) => {
                inputRefs.current[index] = ref;
              }}
              className="w-12 h-12 rounded-2xl border border-neutral-300 bg-white text-center text-lg font-semibold text-neutral-900"
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        {/* Verify button */}
        <TouchableOpacity disabled={loading} onPress={handleSubmit}>
          <LinearGradient
            colors={
              loading ? ["#6B7280", "#6B7280"] : ["#2563EB", "#EC4899"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="mt-8 h-11 flex-row items-center justify-center rounded-full"
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text className="text-sm font-semibold text-white">Verify</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend section */}
        <View className="mt-6 items-center">
          <Text className="text-xs text-neutral-500">
            Didn&apos;t receive the code?
          </Text>

          <TouchableOpacity
            onPress={resendOtp}
            disabled={loading || resendSeconds > 0}
          >
            <Text
              className={`mt-1 text-xs font-semibold ${
                resendSeconds > 0 ? "text-neutral-400" : "text-neutral-900"
              }`}
            >
              Resend OTP{" "}
              <Text className="text-neutral-400">({formattedTimer})</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast */}
      {toast.visible && (
        <View
          className={`absolute bottom-6 right-4 max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${
            toast.type === "success" ? "bg-emerald-500/95" : "bg-red-500/95"
          }`}
        >
          <Text className="text-xs font-semibold text-white">
            {toast.title}
          </Text>
          <Text className="mt-1 text-[11px] text-white/95">
            {toast.message}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
