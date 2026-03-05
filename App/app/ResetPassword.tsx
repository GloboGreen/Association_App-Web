// app/ResetPassword.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import SummaryApi, { baseURL } from "../constants/SummaryApi";

const resetImage = require("../assets/images/reset-password.png");

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const otp = params.otp as string; // comes from ForgotPasswordOtp

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    type: "error" | "success";
    message: string;
  }>({
    visible: false,
    type: "error",
    message: "",
  });

  const showToast = (type: "error" | "success", message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(
      () => setToast({ visible: false, type, message: "" }),
      2500
    );
  };

  const handleSubmit = async () => {
    if (!password || !confirm) {
      showToast("error", "All fields are required.");
      return;
    }
    if (password.length < 6) {
      showToast("error", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      showToast("error", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { method, url } = SummaryApi.reset_password;

      // ✅ match backend: { email, otp, password }
      const res = await fetch(`${baseURL}${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,          // field name must be `otp`
          password,     // field name must be `password`
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", data?.message || "Unable to reset password.");
        return;
      }

      showToast("success", "Password reset successfully.");
      router.replace("/SuccessPassword");
    } catch (err) {
      showToast("error", "Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        className="px-6 pt-6"
      >
        {/* Illustration */}
        <View className="items-center mt-10">
          <Image
            source={resetImage}
            className="w-[250px] h-[250px]"
            style={{ resizeMode: "contain" }}
          />
        </View>

        {/* Title */}
        <Text className="text-[26px] font-bold text-center text-white mb-1.5">
          Set New Password
        </Text>

        <Text className="text-[13px] text-center text-slate-100 mb-7">
          Create a new secure password for your account.
        </Text>

        {/* Password label */}
        <Text className="text-[13px] text-slate-100 mb-1.5">
          Password
        </Text>

        {/* Password Field */}
        <View className="flex-row items-center bg-white/15 rounded-2xl px-3.5 mb-4 border border-white/30">
          <TextInput
            secureTextEntry={!show1}
            placeholder="Enter password"
            placeholderTextColor="#E5E7EB"
            value={password}
            onChangeText={setPassword}
            className="flex-1 text-white py-3 text-[14px]"
          />
          <TouchableOpacity onPress={() => setShow1((p) => !p)}>
            <Ionicons
              name={show1 ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#E5E7EB"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm label */}
        <Text className="text-[13px] text-slate-100 mb-1.5">
          Confirm Password
        </Text>

        {/* Confirm Password Field */}
        <View className="flex-row items-center bg-white/15 rounded-2xl px-3.5 mb-7 border border-white/30">
          <TextInput
            secureTextEntry={!show2}
            placeholder="Confirm password"
            placeholderTextColor="#E5E7EB"
            value={confirm}
            onChangeText={setConfirm}
            className="flex-1 text-white py-3 text-[14px]"
          />
          <TouchableOpacity onPress={() => setShow2((p) => !p)}>
            <Ionicons
              name={show2 ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#E5E7EB"
            />
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          <LinearGradient
            colors={["#FFFFFF", "#F3F4F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-3.5 rounded-full items-center"
          >
            {loading ? (
              <ActivityIndicator color="#2563EB" />
            ) : (
              <Text className="text-[16px] font-bold text-blue-600">
                Create New Password
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Toast */}
        {toast.visible && (
          <View className="mt-5 rounded-xl border border-red-400 bg-red-900/60 px-3 py-2.5">
            <Text className="text-[13px] text-red-100">
              {toast.message}
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
