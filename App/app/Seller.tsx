import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  Easing,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import SellerHeaderMenu from "./components/SellerHeaderMenu";

/* ---------------- GREEN THEME ---------------- */
const GREEN_PRIMARY = "#006400";
const GREEN_SOFT = "#F0FFF0";
const GREEN_COLOR = "#F8F9FD";
const GREEN_LIGHT = "#D1FAE5";
const GREEN_TEXT = "#064E3B";
/* -------------------------------------------- */

const TITLES = ["Payment", "Price", "Pickup"];

const BADGES = [
  "Best Price Guaranteed",
  "Accurate Pricing",
  "Reasonable Offers",
  "Fast & Easy Payment",
];

const DEVICES = [
  {
    id: "phone",
    title: "Sell Phone",
    image: require("../assets/sell/menu-image/Phone_New.png"),
  },
  {
    id: "tablet",
    title: "Sell Tablet",
    image: require("../assets/sell/menu-image/Tablet_New.png"),
  },
  {
    id: "laptop",
    title: "Sell Laptop",
    image: require("../assets/sell/menu-image/Laptop_New.png"),
  },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

export default function Seller() {
  const router = useRouter();

  const [index, setIndex] = useState(0);

  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const marqueeX = useRef(new Animated.Value(0)).current;

  const badgeLoop = useMemo(() => [...BADGES, ...BADGES], []);

  /* ---------------- Animated Title ---------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fade, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slide, {
            toValue: -8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(fade, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(slide, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      setIndex((p) => (p + 1) % TITLES.length);
    }, 1700);

    return () => clearInterval(timer);
  }, [fade, slide]);

  /* ---------------- Marquee ---------------- */
  useEffect(() => {
    marqueeX.setValue(0);

    const loop = Animated.loop(
      Animated.timing(marqueeX, {
        toValue: -320,
        duration: 4500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [marqueeX]);

  function onSelectDevice(id: DeviceId) {
    if (id === "phone") router.push("/SelectBrand");
    if (id === "tablet") router.push("/SellTablet");
    if (id === "laptop") router.push("/SellLaptop");
  }

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: GREEN_SOFT }}
      showsVerticalScrollIndicator={false}
    >
      {/* ================= HEADER ================= */}
      <LinearGradient
        colors={["#006400", "#15803D", "#86EFAC"]}
        className="rounded-full px-4 pb-6"
        style={{ paddingTop: Platform.OS === "ios" ? 56 : 44 }}
      >
        {/* BUY / SELL TOGGLE (LOGIC UNCHANGED) */}
        <View className="mb-4">
          <View className="flex-row rounded-full bg-white/25 p-1">
            <Pressable
              onPress={() => router.push("/Buyer")}
              className="flex-1 items-center rounded-full py-2"
            >
              <Text className="text-sm font-semibold text-white/80">
                Buy
              </Text>
            </Pressable>

            <Pressable className="flex-1 items-center rounded-full bg-white py-2">
              <Text
                className="text-sm font-bold"
                style={{ color: GREEN_PRIMARY }}
              >
                Sell
              </Text>
            </Pressable>
          </View>
        </View>

        {/* HEADER BAR */}
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-extrabold text-white">
            TN <Text className="text-green-200">Tech</Text> Connect
          </Text>

          <View className="flex-row items-center gap-3">
            {/* PROFESSIONAL MENU */}
            <SellerHeaderMenu />

            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white/25">
              <Ionicons
                name="cart-outline"
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </View>

        {/* LOCATION */}
        <Pressable className="mt-2 flex-row items-center self-start rounded-full bg-white/25 px-3 py-1.5">
          <Ionicons
            name="location-outline"
            size={14}
            color="#FFFFFF"
          />
          <Text className="ml-1.5 text-xs font-semibold text-white">
            Cuddalore, Tamil Nadu
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color="#FFFFFF"
            style={{ marginLeft: 4 }}
          />
        </Pressable>

        {/* TITLE */}
        <Animated.View
          style={{ opacity: fade, transform: [{ translateY: slide }] }}
        >
          <Text className="mt-4 text-[30px] font-extrabold leading-9 text-white">
            Sell Your Gadgets,{"\n"}Get Instant {TITLES[index]}
          </Text>
        </Animated.View>

        {/* SEARCH */}
        <View className="mt-5 flex-row items-center rounded-2xl bg-white px-4 py-2">
          <Ionicons
            name="search"
            size={18}
            color={GREEN_TEXT}
          />
          <TextInput
            placeholder="Search your location"
            placeholderTextColor="#9CA3AF"
            className="ml-3 flex-1 text-sm font-semibold"
          />
          <View
            className="ml-2 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: GREEN_PRIMARY }}
          >
            <Ionicons
              name="arrow-forward"
              size={18}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* MARQUEE */}
        <View className="mt-4 overflow-hidden">
          <Animated.View
            className="flex-row"
            style={{ transform: [{ translateX: marqueeX }] }}
          >
            {badgeLoop.map((b, i) => (
              <View
                key={`${b}-${i}`}
                className="mr-6 flex-row items-center"
              >
                <View className="h-2 w-2 rounded-full bg-green-200" />
                <Text className="ml-2 text-xs font-semibold text-white">
                  {b}
                </Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </LinearGradient>

      {/* ================= DEVICES ================= */}
      <View className="mt-8 px-4">
        <Text
          className="mb-4 text-[16px] font-bold"
          style={{ color: GREEN_TEXT }}
        >
          Select Your Device to Sell
        </Text>

        <View className="flex-row justify-between">
          {DEVICES.map((item) => (
            <Pressable
              key={item.id}
              className="w-[31%] items-center"
              onPress={() => onSelectDevice(item.id)}
            >
              <View
                className="mb-3 h-28 w-28 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor:GREEN_COLOR,
                  borderColor: GREEN_LIGHT,
                }}
              >
                <Image
                  source={item.image}
                  className="h-[72px] w-[72px]"
                  resizeMode="contain"
                />
              </View>

              <Text
                className="text-[13px] font-semibold"
                style={{ color: GREEN_TEXT }}
              >
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="h-10" />
    </ScrollView>
  );
}
