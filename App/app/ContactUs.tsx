// app/ContactUs.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactUs() {
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
          <Text className="text-sm font-semibold text-slate-50">
            Contact Us
          </Text>
          <Text className="text-[11px] text-slate-500">
            Support & assistance
          </Text>
        </View>
      </View>

      {/* Card */}
      <View className="p-5 border shadow-md rounded-3xl bg-slate-900/90 border-slate-800 shadow-black/50">
        <View className="flex-row items-center mb-4">
          <View className="p-2 mr-3 rounded-full bg-emerald-500/15">
            <Ionicons name="call-outline" size={18} color="#34d399" />
          </View>
          <View>
            <Text className="text-xs font-semibold text-slate-100 uppercase tracking-[2px]">
              Support
            </Text>
            <Text className="text-[11px] text-slate-500 mt-1">
              We're here to help you
            </Text>
          </View>
        </View>

        <Text className="mb-3 text-sm text-slate-300">
          For any technical or membership support related to the Tamil Nadu
          Mobile Association app:
        </Text>

        <View className="mt-4 space-y-3">
          <View>
            <Text className="text-[11px] text-slate-500 uppercase tracking-[1px]">
              Email
            </Text>
            <Text className="mt-1 text-sm font-semibold text-emerald-400">
              globogreenmobile@gmail.com
            </Text>
          </View>

          <View>
            <Text className="text-[11px] text-slate-500 uppercase tracking-[1px]">
              Phone
            </Text>
            <Text className="mt-1 text-sm font-semibold text-emerald-400">
            +91 80123 45280  
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
