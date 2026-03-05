// app/_layout.tsx
import React from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View, Text } from "react-native";

import { AuthProvider, useAuth } from "./context/AuthContext";
import "./global.css";

const AUTH_SCREENS = [
  "Onboarding",
  "Login",
  "Signup",
  "VerifyEmailOtp",
  "EmployeeLogin",
  "ForgotPasswordEmail",
  "ForgotPasswordOtp",
  "ResetPassword",
  "SuccessPassword",
];

// OPTIONAL: allow these without login (if you want)
// If you DON'T want public access, keep this empty []
const PUBLIC_SCREENS: string[] = []; // e.g. ["select-brand"]

function RootNavigator() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    if (loading) return;

    const current = segments[0] || "Onboarding";
    const isAuthPage = AUTH_SCREENS.includes(current);
    const isPublicPage = PUBLIC_SCREENS.includes(current);

    const isLoggedIn = !!user && !!token;

    // Not logged in → allow only AUTH screens + PUBLIC screens
    if (!isLoggedIn && !isAuthPage && !isPublicPage) {
      router.replace("/Login");
      return;
    }

    // Logged in → don't allow auth screens
    if (isLoggedIn && isAuthPage) {
      if (user?.role === "EMPLOYEE") router.replace("/EmployeeHome");
      else router.replace("/Home");
    }
  }, [user, token, loading, segments, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-2">Loading...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth screens */}
      <Stack.Screen name="Onboarding" />
      <Stack.Screen name="Login" />
      <Stack.Screen name="EmployeeLogin" />
      <Stack.Screen name="Signup" />
      <Stack.Screen name="VerifyEmailOtp" />
      <Stack.Screen name="ForgotPasswordEmail" />
      <Stack.Screen name="ForgotPasswordOtp" />
      <Stack.Screen name="ResetPassword" />
      <Stack.Screen name="SuccessPassword" />

      {/* Main screens */}
      <Stack.Screen name="Home" />
      <Stack.Screen name="EmployeeHome" />
      <Stack.Screen name="Shop" />
      <Stack.Screen name="Profile" />
      <Stack.Screen name="EmployeeProfile" />
      <Stack.Screen name="ScanQR" />
      <Stack.Screen name="ScanQRDetails" />
      <Stack.Screen name="MyQRCode" />
      <Stack.Screen name="ScanHistory" />
      <Stack.Screen name="SubscriptionHistory" />
      <Stack.Screen name="StaffManagement" />
      <Stack.Screen name="ShopManagement" />
      <Stack.Screen name="UpdateAddress" />
      <Stack.Screen name="UpdatePassword" />
      <Stack.Screen name="UploadKyc" />
      <Stack.Screen name="Account" />
      <Stack.Screen name="ChangePassword" />
      <Stack.Screen name="Seller" />

      {/* ✅ Sell flow screens */}
      <Stack.Screen name="SelectBrand" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
