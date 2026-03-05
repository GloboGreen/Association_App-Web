// app/Shop.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import SummaryApi, { baseURL } from "../constants/SummaryApi";
import AppBottomNav from "./components/AppBottomNav";
import { useAuth } from "./context/AuthContext";
import { useRefreshUserOnFocus } from "./hooks/useRefreshUserOnFocus";

type BusinessType = "RETAIL" | "WHOLESALE";

interface ShopLocation {
  lat: number | null;
  lng: number | null;
}

const BUSINESS_CATEGORY_OPTIONS: string[] = [
  "Mobile Sales",
  "Mobile Services",
  "Mobile Spare Parts",
  "Mobile Accessories",
  "Mobile Recharge & SIM Card",
  "Laptop & Desktop Sales",
  "Laptop & Desktop Services",
  "Home Appliances",
];

const isMapSupported = Platform.OS === "ios" || Platform.OS === "android";

export default function Shop() {
  const router = useRouter();
  const { user, token, loading, setAuth, refreshUser } = useAuth();
  useRefreshUserOnFocus();

  const [shopName, setShopName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("RETAIL");
  const [businessCategories, setBusinessCategories] = useState<string[]>([]);

  const [shopStreet, setShopStreet] = useState("");
  const [shopArea, setShopArea] = useState("");
  const [shopCity, setShopCity] = useState("");
  const [shopDistrict, setShopDistrict] = useState("");
  const [shopState, setShopState] = useState("");
  const [shopPincode, setShopPincode] = useState("");

  const [shopLocation, setShopLocation] = useState<ShopLocation>({
    lat: null,
    lng: null,
  });
  const [locationLabel, setLocationLabel] = useState<string>("");

  const [shopFrontUri, setShopFrontUri] = useState<string>("");
  const [shopBannerUri, setShopBannerUri] = useState<string>("");
  const [shopFrontAsset, setShopFrontAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [shopBannerAsset, setShopBannerAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  // 👤 Shop owner avatar (separate from shop photos)
  const [avatarUri, setAvatarUri] = useState<string>("");
  const [avatarAsset, setAvatarAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // 🔒 when true, address inputs are read-only (after using current location)
  const [addressLocked, setAddressLocked] = useState(false);

  const firstLetter =
    (user?.name || "Member").trim().charAt(0).toUpperCase() || "M";

  // Init from user
  useEffect(() => {
    if (!user) return;
    const u: any = user;

    setShopName(
      u.shopName && String(u.shopName).trim() !== ""
        ? String(u.shopName).trim()
        : ""
    );
    setBusinessType((u.BusinessType as BusinessType) || "RETAIL");
    setBusinessCategories(
      u.BusinessCategory ? String(u.BusinessCategory).split(",") : []
    );

    const sa = u.shopAddress || {};
    setShopStreet(sa.street || "");
    setShopArea(sa.area || "");
    setShopCity(sa.city || "");
    setShopDistrict(sa.district || "");
    setShopState(sa.state || "");
    setShopPincode(sa.pincode || "");

    if (u.shopLocation && Array.isArray(u.shopLocation.coordinates)) {
      const [lng, lat] = u.shopLocation.coordinates;
      if (typeof lat === "number" && typeof lng === "number") {
        setShopLocation({ lat, lng });
        setLocationLabel(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
      }
    }

    if (u.shopFront) setShopFrontUri(u.shopFront);
    if (u.shopBanner) setShopBannerUri(u.shopBanner);

    // existing avatar from DB
    if (u.avatar) {
      const raw = String(u.avatar);
      const full = raw && !raw.startsWith("http") ? `${baseURL}${raw}` : raw;
      setAvatarUri(full);
    }
  }, [user?._id]);

  const toggleCategory = (category: string) => {
    setBusinessCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // 🔧 generic image picker (NO crop)
  const pickImage = async (
    source: "camera" | "gallery"
  ): Promise<ImagePicker.ImagePickerAsset | null> => {
    try {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "Allow camera access to capture photo."
          );
          return null;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false, // no crop
          quality: 0.7,
        });

        if (!result.canceled && result.assets?.[0]) {
          return result.assets[0];
        }
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "Allow gallery access to choose photo."
          );
          return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false, // no crop
          quality: 0.7,
        });

        if (!result.canceled && result.assets?.[0]) {
          return result.assets[0];
        }
      }
    } catch (err) {
      console.log("pickImage error:", err);
      Alert.alert("Error", "Unable to select photo.");
    }
    return null;
  };

  // 👤 owner avatar flow
  const pickAvatarFromSource = async (source: "camera" | "gallery") => {
    const asset = await pickImage(source);
    if (!asset) return;
    setAvatarUri(asset.uri);
    setAvatarAsset(asset);
  };

  const handleAvatarPress = () => {
    Alert.alert("Shop owner photo", "Choose photo source", [
      { text: "Camera", onPress: () => pickAvatarFromSource("camera") },
      { text: "Gallery", onPress: () => pickAvatarFromSource("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // 🏪 shop photos flow (front / banner)
  const pickShopImage = async (
    type: "shopFront" | "shopBanner",
    source: "camera" | "gallery"
  ) => {
    const asset = await pickImage(source);
    if (!asset) return;

    if (type === "shopFront") {
      setShopFrontUri(asset.uri);
      setShopFrontAsset(asset);
    } else {
      setShopBannerUri(asset.uri);
      setShopBannerAsset(asset);
    }
  };

  const handleShopImagePress = (type: "shopFront" | "shopBanner") => {
    Alert.alert("Shop photo", "Choose photo source", [
      { text: "Camera", onPress: () => pickShopImage(type, "camera") },
      { text: "Gallery", onPress: () => pickShopImage(type, "gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // 📍 Use current location → fill address + lock inputs
  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Location permission is needed to set shop location."
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = pos.coords;
      setShopLocation({ lat: latitude, lng: longitude });

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (geocode && geocode[0]) {
          const g = geocode[0];

          // Build human-readable detected string (for blue label)
          const detected = [
            g.name,
            g.street,
            g.subregion,
            g.city,
            g.region,
            g.postalCode,
          ]
            .filter(Boolean)
            .join(", ");

          if (detected) {
            setLocationLabel(`Detected address: ${detected}`);
          } else {
            setLocationLabel(
              `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`
            );
          }

          const streetLine = [g.name, g.street].filter(Boolean).join(", ");

          const area = g.subregion || g.district || "";
          const city = g.subregion || g.district || g.city || "";
          const district = g.city || g.district || g.subregion || "";
          const state = g.region || "";
          const pincode = g.postalCode || "";

          // Always overwrite with detected values
          setShopStreet(streetLine);
          setShopArea(area);
          setShopCity(city);
          setShopDistrict(district);
          setShopState(state);
          setShopPincode(pincode);

          // Lock address after GPS fill (read-only behaviour)
          setAddressLocked(true);
        } else {
          setLocationLabel(
            `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`
          );
        }
      } catch (geoErr) {
        console.log("Reverse geocode error:", geoErr);
        setLocationLabel(
          `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`
        );
      }
    } catch (err) {
      console.log("Location error:", err);
      Alert.alert("Error", "Unable to fetch current location.");
    } finally {
      setLocating(false);
    }
  };

  const onSaveShop = async () => {
    if (!shopName) {
      Alert.alert("Shop name required", "Please set your shop name first.");
      return;
    }

    if (!businessCategories.length) {
      Alert.alert(
        "Categories required",
        "Select at least one business category."
      );
      return;
    }

    if (
      !shopStreet ||
      !shopCity ||
      !shopDistrict ||
      !shopState ||
      !shopPincode
    ) {
      Alert.alert(
        "Address incomplete",
        "Please fill street, city, district, state and pincode."
      );
      return;
    }

    if (!shopLocation.lat || !shopLocation.lng) {
      Alert.alert(
        "Location required",
        "Please use current location to set your shop on map."
      );
      return;
    }

    // 🔴 NEW: both photos required
    if (!shopFrontUri || !shopBannerUri) {
      Alert.alert(
        "Shop photos required",
        "Please upload BOTH:\n\n• Shop Front View\n• Shop Banner / Visiting Card"
      );
      return;
    }


    if (!token) {
      Alert.alert("Not logged in", "Please login again.");
      router.replace("/Login");
      return;
    }

    try {
      setSaving(true);

      const form = new FormData();
      form.append("shopName", shopName.trim());
      form.append("BusinessType", businessType);
      form.append("BusinessCategory", businessCategories.join(","));

      form.append(
        "shopAddress",
        JSON.stringify({
          street: shopStreet,
          area: shopArea,
          city: shopCity,
          district: shopDistrict,
          state: shopState,
          pincode: shopPincode,
        })
      );

      form.append(
        "shopLocation",
        JSON.stringify({
          type: "Point",
          coordinates: [shopLocation.lng, shopLocation.lat],
        })
      );

      // 👤 send avatar if changed
      if (avatarAsset) {
        const uri = avatarAsset.uri;
        const ext = uri.split(".").pop() || "jpg";
        form.append("avatar", {
          uri,
          name: `avatar.${ext}`,
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        } as any);
      }

      // 🏪 shop photos
      if (shopFrontAsset) {
        const uri = shopFrontAsset.uri;
        const ext = uri.split(".").pop() || "jpg";
        form.append("shopFront", {
          uri,
          name: `shop-front.${ext}`,
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        } as any);
      }

      if (shopBannerAsset) {
        const uri = shopBannerAsset.uri;
        const ext = uri.split(".").pop() || "jpg";
        form.append("shopBanner", {
          uri,
          name: `shop-banner.${ext}`,
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        } as any);
      }

      const res = await fetch(
        `${baseURL}${SummaryApi.user_update_profile.url}`,
        {
          method: SummaryApi.user_update_profile.method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.log("Save shop error:", data);
        Alert.alert("Error", data.message || "Failed to update shop details");
        return;
      }

      if (data.user && token) {
        await setAuth(data.user, token);
        await refreshUser();
      }

      Alert.alert("Success", "Shop details updated successfully", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/ShopManagement");
          },
        },
      ]);
    } catch (err) {
      console.log("Save shop error:", err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handlePressSave = () => {
    Alert.alert("Confirm shop details", "Are your shop details correct?", [
      { text: "Cancel", style: "cancel" },
      { text: "Save", onPress: () => onSaveShop() },
    ]);
  };

  if (loading || !user) {
    return (
      <LinearGradient
        colors={["#2563EB", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFFFFF" />
          <Text className="mt-2 text-xs text-white">
            Loading shop details...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const role = (user.role as any) || "OWNER";
  const profilePercent = (user as any).profilePercent ?? 0;
  const isVerified = !!(user as any).isProfileVerified;
  const qrCodeUrl = (user as any).qrCodeUrl;
  const shopCompleted = !!(user as any).shopCompleted;

  const region: Region = {
    latitude: shopLocation.lat || 11.1271,
    longitude: shopLocation.lng || 78.6569,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="px-4 pb-3 pt-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.replace("/Home")}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="flex-1 text-center text-sm font-semibold text-white">
              Shop details
            </Text>

            <View className="w-10 h-10" />
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-semibold text-white">
                Store information
              </Text>
              <Text className="mt-0.5 text-[11px] text-white">
                Fill your shop details to complete setup.
              </Text>
            </View>

            <View className="rounded-full bg-white/18 px-3 py-1">
              <Text className="text-[11px] font-semibold text-white">
                Step 2 · Shop profile
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 250,
          }}
        >
          {/* MAIN CARD */}
          <View className="-mt-1 rounded-3xl border border-slate-100 bg-white px-4 py-5 shadow-[0px_8px_22px_rgba(15,23,42,0.22)]">
            {/* Header of section */}
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-7 w-7 items-center justify-center rounded-xl bg-slate-100">
                  <Ionicons
                    name="storefront-outline"
                    size={16}
                    color="#2563EB"
                  />
                </View>
                <Text className="ml-2 text-[12px] font-semibold text-slate-800">
                  Basic shop info
                </Text>
              </View>
              <Text className="text-[10px] text-slate-500">Required</Text>
            </View>

            {/* Shop Name – RED LABEL */}
            <View className="mb-4">
              <Text className="mb-1 text-[11px] font-semibold text-red-600">
                Shop name *
              </Text>
              <TextInput
                value={shopName}
                onChangeText={setShopName}
                placeholder="Enter your shop name"
                editable={false}
                selectTextOnFocus={false}
                placeholderTextColor="#9ca3af"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
              />
            </View>

            {/* Business Type */}
            <View className="mb-5">
              <Text className="mb-2 text-[11px] font-medium text-slate-700">
                Business type
              </Text>
              <View className="flex-row gap-3">
                {(["RETAIL", "WHOLESALE"] as BusinessType[]).map((bt) => {
                  const selected = businessType === bt;
                  return (
                    <TouchableOpacity
                      key={bt}
                      onPress={() => setBusinessType(bt)}
                      className={[
                        "flex-1 h-10 items-center justify-center rounded-full border",
                        selected
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-slate-200",
                      ].join(" ")}
                    >
                      <Text
                        className={[
                          "text-[12px]",
                          selected
                            ? "text-blue-700 font-semibold"
                            : "text-slate-600",
                        ].join(" ")}
                      >
                        {bt === "RETAIL" ? "Retail" : "Wholesale"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Divider */}
            <View className="my-3 h-[1px] bg-slate-100" />

            {/* Categories */}
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-7 w-7 items-center justify-center rounded-xl bg-slate-100">
                  <Ionicons
                    name="pricetags-outline"
                    size={16}
                    color="#EC4899"
                  />
                </View>
                <Text className="ml-2 text-[12px] font-semibold text-slate-800">
                  Business categories
                </Text>
              </View>
            </View>

            <Text className="mb-2 text-[10px] text-slate-600">
              Select the services/products your shop provides.
            </Text>

            <View className="mb-4 flex-row flex-wrap gap-2">
              {BUSINESS_CATEGORY_OPTIONS.map((cat) => {
                const selected = businessCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    className={[
                      "px-3 py-1.5 rounded-full border",
                      selected
                        ? "bg-pink-50 border-pink-500"
                        : "bg-white border-slate-200",
                    ].join(" ")}
                  >
                    <Text
                      className={[
                        "text-[11px]",
                        selected
                          ? "text-pink-700 font-semibold"
                          : "text-slate-600",
                      ].join(" ")}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Divider */}
            <View className="my-3 h-[1px] bg-slate-100" />

            {/* Address Section */}
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-7 w-7 items-center justify-center rounded-xl bg-slate-100">
                  <Ionicons name="location-outline" size={16} color="#2563EB" />
                </View>
                <Text className="ml-2 text-[12px] font-semibold text-slate-800">
                  Shop address
                </Text>
              </View>
            </View>

            <Text className="mb-2 text-[10px] text-slate-600">
              This address will be used for association records and map.
            </Text>

            {/* Map location */}
            <View className="mb-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[11px] font-medium text-slate-700">
                  Map location
                </Text>
                <TouchableOpacity
                  onPress={handleUseCurrentLocation}
                  disabled={locating}
                  className="rounded-full bg-blue-600 px-3 py-1"
                >
                  {locating ? (
                    <ActivityIndicator size="small" color="#EFF6FF" />
                  ) : (
                    <Text className="text-[11px] font-semibold text-blue-50">
                      Use current location
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text className="mb-2 text-[10px] text-slate-600">
                Pin your exact shop location using GPS.
              </Text>

              {locationLabel ? (
                <Text className="mb-1 text-[10px] text-blue-700">
                  {locationLabel}
                </Text>
              ) : null}

              <View className="h-44 overflow-hidden rounded-2xl border border-slate-200">
                {isMapSupported ? (
                  <MapView
                    style={{ flex: 1 }}
                    region={region}
                    showsUserLocation
                    showsMyLocationButton
                  >
                    {shopLocation.lat && shopLocation.lng && (
                      <Marker
                        coordinate={{
                          latitude: shopLocation.lat,
                          longitude: shopLocation.lng,
                        }}
                        title={shopName || "My shop"}
                      />
                    )}
                  </MapView>
                ) : (
                  <View className="flex-1 items-center justify-center bg-slate-50">
                    <Ionicons name="map-outline" size={24} color="#2563EB" />
                    <Text className="mt-1 px-4 text-center text-[11px] text-slate-600">
                      Map preview is disabled in this build.{"\n"}
                      Location will still be saved using GPS.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Address inputs (auto-filled + lock when addressLocked) */}
            <View className="mb-4">
              <TextInput
                value={shopStreet}
                onChangeText={setShopStreet}
                placeholder="Street / Door no."
                placeholderTextColor="#9ca3af"
                editable={!addressLocked}
                selectTextOnFocus={!addressLocked}
                className="h-11 mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-900"
              />
              <TextInput
                value={shopArea}
                onChangeText={setShopArea}
                placeholder="Area / Locality"
                placeholderTextColor="#9ca3af"
                editable={!addressLocked || !shopArea}
                selectTextOnFocus={!addressLocked || !shopArea}
                className="h-11 mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-900"
              />
              <TextInput
                value={shopCity}
                onChangeText={setShopCity}
                placeholder="City / Town"
                placeholderTextColor="#9ca3af"
                editable={!addressLocked}
                selectTextOnFocus={!addressLocked}
                className="h-11 mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-900"
              />
              <TextInput
                value={shopDistrict}
                onChangeText={setShopDistrict}
                placeholder="District"
                placeholderTextColor="#9ca3af"
                editable={!addressLocked || !shopDistrict}
                selectTextOnFocus={!addressLocked || !shopDistrict}
                className="h-11 mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-900"
              />
              <TextInput
                value={shopState}
                onChangeText={setShopState}
                placeholder="State"
                placeholderTextColor="#9ca3af"
                editable={!addressLocked}
                selectTextOnFocus={!addressLocked}
                className="h-11 mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-900"
              />
              <TextInput
                value={shopPincode}
                onChangeText={setShopPincode}
                placeholder="Pincode"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
                editable={!addressLocked}
                selectTextOnFocus={!addressLocked}
                className="h-11 mb-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-900"
              />
            </View>

            {/* Divider */}
            <View className="my-3 h-[1px] bg-slate-100" />

            {/* 👤 Shop owner photo section (separate) */}
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-7 w-7 items-center justify-center rounded-xl bg-slate-100">
                  <Ionicons
                    name="person-circle-outline"
                    size={18}
                    color="#2563EB"
                  />
                </View>
                <Text className="ml-2 text-[12px] font-semibold text-slate-800">
                  Shop owner photo
                </Text>
              </View>
              <Text className="text-[10px] text-slate-500">For ID & KYC</Text>
            </View>

            <View className="items-center mt-2 mb-4">
              <TouchableOpacity onPress={handleAvatarPress}>
                <View className="p-[3px] rounded-full bg-blue-500/90">
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      className="h-24 w-24 rounded-full border-2 border-white"
                    />
                  ) : (
                    <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-600">
                      <Text className="text-4xl font-bold text-white">
                        {firstLetter}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-blue-600 border-2 border-white">
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text className="mt-2 text-[10px] text-slate-600">
                Tap to choose from camera or gallery (no crop).
              </Text>
            </View>

            {/* Divider between owner and shop photos */}
            <View className="my-3 h-[1px] bg-slate-100" />

            {/* 🏪 Shop photos section */}
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-7 w-7 items-center justify-center rounded-xl bg-slate-100">
                  <Ionicons name="camera-outline" size={16} color="#EC4899" />
                </View>
                <Text className="ml-2 text-[12px] font-semibold text-slate-800">
                  Shop photos <Text className="text-red-500">*</Text>
                </Text>
              </View>
              <Text className="text-[10px] font-semibold text-red-500">
                Both photos required
              </Text>
            </View>

            <View className="mt-1 flex-row gap-3 mb-1">
              {/* Shop front */}
              <View className="flex-1">
                <Text className="mb-1 text-[10px] text-slate-600">
                  Shop Front View
                </Text>
                <TouchableOpacity
                  onPress={() => handleShopImagePress("shopFront")}
                  className="h-28 items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50/70"
                >
                  {shopFrontUri ? (
                    <Image
                      source={{ uri: shopFrontUri }}
                      className="h-full w-full rounded-2xl"
                    />
                  ) : (
                    <View className="items-center justify-center">
                      <Ionicons
                        name="camera-outline"
                        size={22}
                        color="#2563EB"
                      />
                      <Text className="mt-1 text-[10px] text-blue-700">
                        Tap to add photo
                      </Text>
                      <Text className="text-[9px] text-blue-500">
                        Camera or gallery, no crop
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Shop banner / inside */}
              <View className="flex-1">
                <Text className="mb-1 text-[10px] text-slate-600">
                  Shop Banner or Visiting Card
                </Text>
                <TouchableOpacity
                  onPress={() => handleShopImagePress("shopBanner")}
                  className="h-28 items-center justify-center rounded-2xl border border-dashed border-pink-300 bg-pink-50/70"
                >
                  {shopBannerUri ? (
                    <Image
                      source={{ uri: shopBannerUri }}
                      className="h-full w-full rounded-2xl"
                    />
                  ) : (
                    <View className="items-center justify-center">
                      <Ionicons
                        name="images-outline"
                        size={22}
                        color="#EC4899"
                      />
                      <Text className="mt-1 text-[10px] text-pink-700">
                        Tap to add photo
                      </Text>
                      <Text className="text-[9px] text-pink-500">
                        Camera or gallery, no crop
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Save button */}
            <View className="mt-5">
              <TouchableOpacity disabled={saving} onPress={handlePressSave}>
                <LinearGradient
                  colors={
                    saving ? ["#9CA3AF", "#9CA3AF"] : ["#2563EB", "#EC4899"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="h-11 w-full items-center justify-center rounded-full shadow-md"
                >
                  {saving ? (
                    <ActivityIndicator color="#EFF6FF" />
                  ) : (
                    <Text className="text-[13px] font-semibold text-white">
                      Save shop details
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <AppBottomNav
          active="shop"
          role={role}
          id={user._id}
          name={user.name}
          email={user.email}
          image={user.avatar}
          qrCodeUrl={qrCodeUrl}
          profilePercent={profilePercent}
          isVerified={isVerified}
          shopCompleted={shopCompleted}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
