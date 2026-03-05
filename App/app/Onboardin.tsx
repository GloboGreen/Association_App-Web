import React, { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Animated,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Onboarding() {
  const router = useRouter();

  // Fade + slide animation
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <SafeAreaView className="flex-1 px-6 pt-6 pb-8">
        {/* Main content card */}
        <View className="flex-1 justify-center">
          <Animated.View
            style={{
              opacity,
              transform: [{ translateY }],
            }}
            className="self-center w-full max-w-sm items-center rounded-3xl px-6 py-10 bg-white/10 border border-white/15"
          >
            {/* Title */}
            <Text className="text-white text-3xl font-extrabold text-center mb-1">
              Welcome
            </Text>

            <Text className="text-white/80 text-sm text-center mb-2">
              TN Tech Connect
            </Text>

            {/* Description */}
            <Text className="text-white/85 text-sm text-center leading-5 mb-0">
              Your digital hub for members, shops and QR-based transactions.
              Stay connected, stay organised, and grow together.
            </Text>

            {/* Illustration */}
            <Image
              source={require("../assets/images/Welcome.png")}
              className="w-[400px] h-[400px] max-w-full"
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Bottom buttons */}
        <View className="w-full items-center mt-4">
          {/* Create Account */}
          <TouchableOpacity
            onPress={() => router.replace("/Signup")}   // ⬅️ changed to replace
            className="w-full bg-white py-3.5 rounded-full mb-4 shadow-lg"
            activeOpacity={0.85}
          >
            <Text className="text-center text-[#4C6FFF] text-lg font-bold">
              Create Account
            </Text>
          </TouchableOpacity>

          {/* Log In */}
          <TouchableOpacity
            onPress={() => router.replace("/Login")}    // ⬅️ changed to replace
            className="w-full border border-white/80 py-3.5 rounded-full"
            activeOpacity={0.85}
          >
            <Text className="text-center text-white text-lg font-semibold">
              Log In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text className="mt-6 text-white/60 text-[10px] text-center">
          © 2025, All rights reserved. Globo Green Tech System Pvt.Ltd
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}
