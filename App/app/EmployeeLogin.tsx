// app/EmployeeLogin.tsx
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SummaryApi, { baseURL } from "../constants/SummaryApi";
import { useAuth } from "./context/AuthContext";

type ToastType = "success" | "error";

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message: string;
}

export default function EmployeeLogin() {
  const router = useRouter();
  const { setAuth } = useAuth();

  // 🔹 EMPLOYEE-ONLY FIELDS
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const [loading, setLoading] = useState(false);

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

  /* ====================
   * EMPLOYEE LOGIN (PIN)
   * ==================== */
  const handleLogin = async () => {
    if (!mobile || !pin) {
      showToast(
        "error",
        "Missing details",
        "Please enter your mobile and PIN."
      );
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        mobile: mobile.trim(),
        pin,
      };

      const url = `${baseURL}${SummaryApi.login.url}`;
      console.log("🔐 Employee login →", url, payload);

      const res = await fetch(url, {
        method: SummaryApi.login.method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      console.log("🔍 Raw login response:", raw);

      let data: any = null;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        console.log("❌ Failed to parse login JSON:", parseErr);
        showToast(
          "error",
          "Server error",
          "Unexpected response from server. Please try again."
        );
        return;
      }

      console.log("✅ Parsed login response:", data);

      if (!res.ok || !data?.success) {
        showToast(
          "error",
          "Login failed",
          data?.message || "Invalid credentials."
        );
        return;
      }

      if (!data.accessToken) {
        showToast(
          "error",
          "Login error",
          "Token missing from response. Please try again."
        );
        return;
      }

      const loginType = data.loginType;

      /* ---------- EMPLOYEE BRANCH ---------- */
      if (loginType === "EMPLOYEE" && data.employee) {
        const employee = data.employee || {};

        const enhancedEmployee = {
          ...employee,
          role: employee.role || "EMPLOYEE",
          profilePercent: employee.profilePercent ?? 0,
          isProfileVerified: true,
          shopCompleted: true,
          ownerVerified: !!employee.ownerIsProfileVerified,
        };

        await setAuth(enhancedEmployee, data.accessToken);

        const name = enhancedEmployee.name || "Employee";
        showToast("success", "Welcome", `Hello ${name}!`);

        console.log("➡️ Redirecting (EMPLOYEE) to ScanQR");
        setTimeout(() => {
          router.replace("/EmployeeHome");
        }, 900);

        return;
      }

      // If backend returns MEMBER for some reason
      if (loginType === "MEMBER" && data.user) {
        showToast(
          "error",
          "Wrong portal",
          "This is employee login. Please use Member Login screen."
        );
        return;
      }

      // Fallback
      showToast(
        "error",
        "Login error",
        "Could not determine login type. Please try again."
      );
    } catch (err: any) {
      console.log("❌ Login network/error:", err);

      const msg =
        err?.message?.includes("Network request failed")
          ? "Cannot reach server. Check your internet connection."
          : "Something went wrong. Please try again later.";

      showToast("error", "Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const goToMemberLogin = () => {
    router.push("/Login");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFF]">
      {/* Gradient header */}
      <LinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-x-0 top-0 h-[350px]"
      />

      <View className="flex-1">
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-6 mt-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-lg font-semibold text-white">‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToMemberLogin}
            className="rounded-full bg-white/25 px-3 py-1.5"
            activeOpacity={0.9}
          >
            <Text className="text-[11px] font-semibold text-white">
              Member Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* App title */}
        <View className="mt-10 items-center">
          <Text className="text-3xl font-semibold text-white tracking-wide">
            TAMIL NADU
          </Text>
          <Text className="-mt-1 text-3xl font-semibold text-white">
            Tech Connect
          </Text>
        </View>

        {/* White card */}
        <View className="flex-1 justify-center -mt-[160px]">
          <View className="mx-4 mb-4 rounded-3xl bg-white px-6 pt-10 pb-12 shadow-[0_-18px_40px_rgba(15,23,42,0.25)]">
            {/* Title */}
            <Text className="mb-1 text-2xl font-bold text-slate-900">
              Employee Login
            </Text>
            <Text className="mb-6 text-[13px] text-slate-500">
              Enter your registered mobile and PIN
            </Text>

            {/* Mobile */}
            <View className="mb-4">
              <Text className="mb-1 text-[11px] text-slate-500">
                Mobile Number
              </Text>
              <View className="h-11 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3 shadow-[0_1px_5px_rgba(15,23,42,0.05)]">
                <Ionicons
                  name="call-outline"
                  size={16}
                  color="#9CA3AF"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  className="flex-1 text-sm text-slate-900"
                  placeholder="98765XXXXX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={mobile}
                  onChangeText={setMobile}
                  maxLength={10}
                />
              </View>
            </View>

            {/* PIN */}
            <View className="mb-8">
              <Text className="mb-1 text-[11px] text-slate-500">PIN</Text>
              <View className="h-11 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3 shadow-[0_1px_5px_rgba(15,23,42,0.05)]">
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color="#9CA3AF"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  className="flex-1 text-sm text-slate-900"
                  placeholder="4–6 digit PIN"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPin}
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={() => setShowPin((p) => !p)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPin ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign in button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <LinearGradient
                colors={
                  loading ? ["#9CA3AF", "#9CA3AF"] : ["#2563EB", "#EC4899"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-11 w-full items-center justify-center rounded-full"
              >
                {loading ? (
                  <ActivityIndicator color="#F9FAFB" />
                ) : (
                  <Text className="text-sm font-semibold text-white">
                    Sign in
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Info */}
            <View className="mt-4 items-center">
              <Text className="text-[11px] text-slate-500 text-center">
                PIN is provided by your shop owner.{"\n"}
                If you don&apos;t have a PIN, please contact your owner.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Toast */}
      {toast.visible && (
        <View
          className={`absolute bottom-6 mx-4 rounded-xl px-4 py-3 shadow-lg ${
            toast.type === "success" ? "bg-emerald-500/95" : "bg-red-500/95"
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
