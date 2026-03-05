// app/Login.tsx
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

/** ---------------------------------------------------
 *  Calculate profile completion % (fallback if needed)
 * --------------------------------------------------- */
function calculateProfilePercent(user: any): number {
  let total = 0;
  let done = 0;

  const addCheck = (ok: boolean) => {
    total += 1;
    if (ok) done += 1;
  };

  // Profile basics
  addCheck(!!user.name);
  addCheck(!!user.additionalNumber);

  // Member address
  addCheck(!!user.address && !!user.address.street);
  addCheck(!!user.address && !!user.address.city);
  addCheck(!!user.address && !!user.address.pincode);

  // Shop basic
  addCheck(!!user.shopName);

  // Shop address
  addCheck(!!user.shopAddress && !!user.shopAddress.street);
  addCheck(!!user.shopAddress && !!user.shopAddress.city);
  addCheck(!!user.shopAddress && !!user.shopAddress.pincode);

  // Shop photos
  addCheck(!!user.shopFront);
  addCheck(!!user.shopBanner);

  // Business details
  addCheck(!!user.BusinessType);
  addCheck(!!user.BusinessCategory);

  if (!total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export default function Login() {
  const router = useRouter();
  const { user, token, setAuth } = useAuth(); // read user + token from context

  // MEMBER-ONLY FIELDS
  const [identifier, setIdentifier] = useState(""); // email or mobile
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  /* --------------------------------------
   * IF ALREADY LOGGED-IN → SKIP LOGIN UI
   * -------------------------------------- */
  useEffect(() => {
    if (!user || !token) return;

    const profilePercent =
      typeof user.profilePercent === "number"
        ? user.profilePercent
        : calculateProfilePercent(user);

    const backendShopCompleted = !!user.shopCompleted;
    const shopCompleted =
      backendShopCompleted && profilePercent >= 60 ? true : false;

    const enhancedUser = {
      ...user,
      profilePercent,
      shopCompleted,
      isProfileVerified: !!user.isProfileVerified,
      role: user.role || "OWNER",
    };

    const firstScreen =
      enhancedUser.role === "OWNER"
        ? shopCompleted
          ? "/Home"
          : "/Shop"
        : "/Home";

    // Directly go to the main screen, remove Login from stack
    router.replace(firstScreen);
  }, [user, token, router]);

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

  /* ============================
   * MEMBER LOGIN (email/mobile)
   * ============================ */
  const handleLogin = async () => {
    if (!identifier || !password) {
      showToast(
        "error",
        "Missing details",
        "Please enter your email/mobile and password."
      );
      return;
    }

    try {
      setLoading(true);

      const payload: any = {};
      const trimmedIdentifier = identifier.trim();
      const isEmail = trimmedIdentifier.includes("@");

      if (isEmail) {
        payload.email = trimmedIdentifier;
      } else {
        payload.mobile = trimmedIdentifier;
      }
      payload.password = password;

      const url = `${baseURL}${SummaryApi.login.url}`;
      console.log("🔐 Member login →", url, payload);

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

      /* 🔐 NEW: handle non-OK responses (403 for unverified email) */
      if (!res.ok) {
        if (data?.requiresEmailVerification) {
          const emailForOtp = isEmail ? trimmedIdentifier : data.email;

          if (!emailForOtp) {
            showToast(
              "error",
              "Verify your email",
              data?.message ||
              "Your email is not verified. Please sign up again."
            );
            return;
          }

          showToast(
            "error",
            "Verify your email",
            data?.message ||
            "Your email is not verified. We have sent an OTP to your email."
          );

          setTimeout(() => {
            router.push({
              pathname: "/VerifyEmailOtp",
              params: { email: emailForOtp },
            });
          }, 800);

          return;
        }

        // Other login errors (wrong password, user not found, etc.)
        showToast(
          "error",
          "Login failed",
          data?.message || "Invalid credentials."
        );
        return;
      }

      // HTTP OK but backend says success=false
      if (!data?.success) {
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

      /* ---------- MEMBER BRANCH ---------- */
      if (loginType === "MEMBER" && data.user) {
        const userFromApi = data.user || {};

        const profilePercent =
          typeof userFromApi.profilePercent === "number"
            ? userFromApi.profilePercent
            : calculateProfilePercent(userFromApi);

        const backendShopCompleted = !!userFromApi.shopCompleted;
        const shopCompleted =
          backendShopCompleted && profilePercent >= 60 ? true : false;

        const enhancedUser = {
          ...userFromApi,
          profilePercent,
          shopCompleted,
          isProfileVerified: !!userFromApi.isProfileVerified,
          role: userFromApi.role || "OWNER",
        };

        // Save to context + AsyncStorage
        await setAuth(enhancedUser, data.accessToken);

        const name = enhancedUser.name || "Member";
        showToast("success", "Welcome back", `Hello ${name}!`);

        const firstScreen =
          enhancedUser.role === "OWNER"
            ? shopCompleted
              ? "/Home"
              : "/Shop"
            : "/Home";

        console.log("➡️ Redirecting (MEMBER) to:", firstScreen, {
          role: enhancedUser.role,
          shopCompleted,
        });

        router.replace(firstScreen); // important: replace, not push
        return;
      }

      // If backend returns EMPLOYEE here by mistake
      if (loginType === "EMPLOYEE" && data.employee) {
        showToast(
          "error",
          "Wrong portal",
          "This is member login. Please use Employee Login screen."
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

  const goToSignup = () => {
    router.push("/Signup");
  };

  const goToEmployeeLogin = () => {
    router.push("/EmployeeLogin");
  };

  const keyboardType: any = identifier.includes("@")
    ? "email-address"
    : "phone-pad";

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFF]">
      {/* Gradient header background – Jobsly style */}
      <LinearGradient
        colors={["#2563EB", "#EC4899"]} // blue → pink
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-x-0 top-0 h-[400px]"
      />

      <View className="flex-1">
        {/* Top bar: Get Started pill */}
        <View className="flex-row items-center justify-center px-6 mt-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-[11px] text-white/90">
              Don&apos;t have an account?
            </Text>

            <TouchableOpacity
              onPress={goToSignup}
              className="rounded-full bg-white/25 px-3 py-1.5"
              activeOpacity={0.9}
            >
              <Text className="text-[11px] font-semibold text-white">
                Get Started
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* App title */}
        <View className="mt-10 items-center p-[30px]">
          <Text className="text-3xl font-semibold text-white tracking-wide">
            TAMIL NADU
          </Text>
          <Text className="text-3xl font-semibold text-white tracking-wide">
            Tech Connect
          </Text>
        </View>

        {/* White card */}
        <View className="flex-1 justify-center">
          <View className="mx-4 mb-[100px] rounded-3xl bg-white px-6 pt-10 pb-12 shadow-[0_-18px_40px_rgba(15,23,42,0.25)]">
            {/* Welcome text */}
            <Text className="mb-1 text-2xl font-bold text-slate-900">
              Member Login
            </Text>
            <Text className="mb-6 text-[13px] text-slate-500">
              Enter your email / mobile and password
            </Text>

            {/* Identifier */}
            <View className="mb-4">
              <Text className="mb-1 text-[11px] text-slate-500">
                Email Address / Mobile
              </Text>
              <View className="h-11 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3 shadow-[0_1px_5px_rgba(15,23,42,0.05)]">
                <Ionicons
                  name="person-outline"
                  size={16}
                  color="#9CA3AF"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  className="flex-1 text-sm text-slate-900"
                  placeholder="nicholas@ergemla.com / 98765XXXXX"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-8">
              <Text className="mb-1 text-[11px] text-slate-500">
                Password
              </Text>
              <View className="h-11 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3 shadow-[0_1px_5px_rgba(15,23,42,0.05)]">
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color="#9CA3AF"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  className="flex-1 text-sm text-slate-900"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
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

            {/* Switch to employee login */}
            <TouchableOpacity
              className="mt-4 items-center"
              onPress={goToEmployeeLogin}
            >
              <Text className="text-[11px] text-slate-500">
                Are you an employee?{" "}
                <Text className="font-semibold text-blue-600">
                  Employee Login
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Forgot password */}
            <TouchableOpacity
              className="mt-4 items-center"
              onPress={() => router.push("/ForgotPasswordEmail")}
            >
              <Text className="text-[11px] text-slate-500 font-medium">
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Toast */}
      {toast.visible && (
        <View
          className={`absolute bottom-6 mx-4 rounded-xl px-4 py-3 shadow-lg ${toast.type === "success" ? "bg-emerald-500/95" : "bg-red-500/95"
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
