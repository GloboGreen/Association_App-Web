// app/Faqs.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Faqs() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 px-6 bg-slate-950">
      {/* HEADER */}
      <View className="flex-row items-center mt-4 mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="items-center justify-center rounded-full w-9 h-9 bg-slate-900"
        >
          <Ionicons name="chevron-back" size={20} color="#e5e7eb" />
        </TouchableOpacity>

        <View className="ml-3">
          <Text className="text-sm font-semibold text-slate-50">FAQs</Text>
          <Text className="text-[11px] text-slate-500">
            Common questions & answers
          </Text>
        </View>
      </View>

      {/* FAQ CARD */}
      <View className="p-5 border shadow-md rounded-3xl bg-slate-900/90 border-slate-800 shadow-black/50">
        <View className="flex-row items-center mb-5">
          <View className="p-2 mr-3 rounded-full bg-sky-500/15">
            <Ionicons name="help-circle-outline" size={18} color="#38bdf8" />
          </View>
          <View>
            <Text className="text-xs font-semibold text-slate-100 uppercase tracking-[2px]">
              Help Guide
            </Text>
            <Text className="text-[11px] text-slate-500 mt-1">
              Quick solutions for members
            </Text>
          </View>
        </View>

        {/* FAQ LIST */}
        <View className="space-y-5">
          <View>
            <Text className="text-sm font-semibold text-slate-100">
              1. How do I edit my account details?
            </Text>
            <Text className="mt-1 text-xs leading-5 text-slate-400">
              Go to <Text className="text-emerald-400">Profile → Account</Text>{" "}
              to update your name, Additional Number or profile photo.
            </Text>
          </View>

          <View>
            <Text className="text-sm font-semibold text-slate-100">
              2. How can I change my password?
            </Text>
            <Text className="mt-1 text-xs leading-5 text-slate-400">
              Go to <Text className="text-emerald-400">Profile → Update Password</Text> 
              to change your password securely.
            </Text>
          </View>

          <View>
            <Text className="text-sm font-semibold text-slate-100">
              3. How do I update my address?
            </Text>
            <Text className="mt-1 text-xs leading-5 text-slate-400">
              Visit <Text className="text-emerald-400">Profile → Update Address</Text>{" "}
              to edit your communication address.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
