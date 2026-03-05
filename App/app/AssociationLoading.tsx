// app/AssociationLoading.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./context/AuthContext";

export default function AssociationLoading() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace("/Home");
    } else {
      router.replace("/Login");
    }
  }, [loading, user, router]);

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo + title */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 mb-4 rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-orange-400 items-center justify-center shadow-xl shadow-red-900/70">
            <Ionicons name="bus-outline" size={32} color="#f9fafb" />
          </View>
          <Text className="text-2xl font-semibold text-slate-50">
            Association App
          </Text>
          <Text className="mt-1 text-xs text-slate-400">
            Getting things ready for you...
          </Text>
        </View>

        {/* Card with road + bus + progress bar */}
        <View className="w-full mb-8 overflow-hidden rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl shadow-black/70">
          <View className="px-5 pt-4">
            <Text className="text-xs font-medium text-slate-300">
              Connecting to your association
            </Text>
            <Text className="mt-1 text-[11px] text-slate-500">
              Verifying session, syncing your profile & shop details.
            </Text>
          </View>

          <View className="flex-row items-center justify-between px-5 mt-6">
            <View className="w-9 h-9 rounded-full bg-red-500/90 items-center justify-center shadow-md shadow-red-900/70">
              <Ionicons name="bus-outline" size={20} color="#f9fafb" />
            </View>

            <View className="flex-1 mx-3">
              <View className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <View className="w-3/5 h-2 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400 animate-pulse" />
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-[10px] text-slate-500">Starting</Text>
                <Text className="text-[10px] text-slate-500">Loading</Text>
                <Text className="text-[10px] text-slate-500">Almost there</Text>
              </View>
            </View>

            <View className="items-center">
              <Ionicons name="time-outline" size={18} color="#fecaca" />
              <Text className="mt-1 text-[9px] text-rose-200">Few sec</Text>
            </View>
          </View>

          <View className="px-5 pt-4 pb-5 mt-2">
            <Text className="text-[11px] text-slate-500">
              Please do not close the app while we finish the setup.
            </Text>
          </View>
        </View>

        <Text className="mt-4 text-[10px] text-slate-500">
          Powered by TN Tech Connect
        </Text>
      </View>
    </SafeAreaView>
  );
}
