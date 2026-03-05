// app/components/AppBottomNav.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRouter } from "expo-router";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Role } from "../context/AuthContext";

type TabKey = "home" | "shop" | "qr" | "history" | "profile";

interface Props {
  active: TabKey;
  role?: Role;
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  qrCodeUrl?: string;
  profilePercent?: number;
  isVerified?: boolean;
  shopCompleted?: boolean;
}

interface TabConfig {
  key: TabKey;
  label: string;
  icon: string;
}

export default function AppBottomNav({
  active,
  role = "OWNER",
  id = "",
  name = "",
  email = "",
  image = "",
  qrCodeUrl = "",
  profilePercent = 0,
  isVerified = false,
  shopCompleted = false,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const effectiveRole: Role = role || "OWNER";

  const Admin: TabConfig[] = [
    { key: "home", label: "Home", icon: "home-outline" },
    { key: "profile", label: "Profile", icon: "person-circle-outline" },
  ];

  const User: TabConfig[] = [
    { key: "home", label: "Home", icon: "home-outline" },
    { key: "profile", label: "Profile", icon: "person-circle-outline" },
  ];

  const tabs = effectiveRole === "EMPLOYEE" ? employeeTabs : allTabs;

  const goTo = (key: TabKey) => {
    if (key === active) return;

    // Home → different screen for OWNER vs EMPLOYEE
    if (key === "home") {
      router.replace(effectiveRole === "EMPLOYEE" ? "/EmployeeHome" : "/Home");
      return;
    }

    if (key === "shop") {
      if (effectiveRole === "EMPLOYEE") {
        alert("Only owners can manage shop details.");
        return;
      }
      if (shopCompleted) {
        router.replace("/ShopManagement");
      } else {
        router.replace("/Shop");
      }
      return;
    }

    if (key === "qr") {
      router.replace({
        pathname: "/ScanQR",
        params: {
          role: effectiveRole,
          name,
          email,
          qrCodeUrl,
          isVerified: isVerified ? "true" : "false",
        },
      });
      return;
    }

    if (key === "history") {
      router.replace({
        pathname: "/ScanHistory",
        params: {
          role: effectiveRole,
          id,
          name,
          email,
          image,
          qrCodeUrl,
          profilePercent: String(profilePercent ?? 0),
          isVerified: isVerified ? "true" : "false",
        },
      });
      return;
    }

    if (key === "profile") {
      // ✅ Correct routing: EMPLOYEE → /EmployeeProfile, others → /Profile
      const profilePath =
        effectiveRole === "EMPLOYEE" ? "/EmployeeProfile" : "/Profile";

      router.replace({
        pathname: profilePath,
        params: { id, name, email, role: effectiveRole, image },
      });
      return;
    }
  };

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      <View
        className="flex-row items-center justify-between px-4 bg-white border-t border-slate-200 shadow-xl rounded-t-3xl"
        style={{
          paddingTop: Platform.OS === "ios" ? 10 : 6,
          paddingBottom: 12,
        }}
      >
        {tabs.map((item) => {
          const isActive = active === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => goTo(item.key)}
              className="items-center justify-center flex-1"
            >
              <View className="items-center justify-center">
                {/* ICON */}
                {isActive ? (
                  <MaskedView
                    style={{ width: 24, height: 24 }}
                    maskElement={
                      <View className="flex-1 items-center justify-center">
                        <Ionicons
                          name={item.icon as any}
                          size={24}
                          color="black"
                        />
                      </View>
                    }
                  >
                    <LinearGradient
                      colors={["#2563EB", "#EC4899"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flex: 1 }}
                    />
                  </MaskedView>
                ) : (
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color="#A1A1AA"
                  />
                )}

                {/* LABEL */}
                <Text
                  className={`text-[11px] mt-1 ${
                    isActive ? "font-semibold" : ""
                  }`}
                  style={{
                    color: isActive ? "#2563EB" : "#A1A1AA",
                  }}
                >
                  {item.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
