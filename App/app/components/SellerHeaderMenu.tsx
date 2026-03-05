import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

/* ---------- GREEN THEME ---------- */
const GREEN_PRIMARY = "#006400";
const GREEN_SOFT = "#F0FFF0";
const GREEN_LIGHT = "#D1FAE5";
const GREEN_TEXT = "#064E3B";
/* -------------------------------- */

type DeviceType = "phone" | "tablet" | "laptop";

export default function SellerHeaderMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<DeviceType | null>(null);

  function closeMenu() {
    setOpen(false);
    setExpanded(null);
  }

  function toggle(type: DeviceType) {
    setExpanded((prev) => (prev === type ? null : type));
  }

  function goSell(route: string) {
    closeMenu();
    router.push(route as any);
  }

  function goProducts(type: DeviceType) {
    closeMenu();
    router.push(
      { pathname: "/SellProducts", params: { type } } as any
    );
  }

  return (
    <>
      {/* MENU BUTTON */}
      <Pressable
        onPress={() => setOpen(true)}
        className="h-10 w-10 items-center justify-center rounded-full bg-white/25"
      >
        <Ionicons name="menu" size={22} color="#FFFFFF" />
      </Pressable>

      {/* DRAWER */}
      <Modal visible={open} transparent animationType="fade">
        <View className="flex-1 flex-row bg-black/40">
          {/* LEFT DRAWER */}
          <View
            className="h-full w-[78%] px-6 pt-12"
            style={{ backgroundColor: GREEN_SOFT }}
          >
            {/* HEADER WITH CLOSE */}
            <View className="mb-8 flex-row items-start justify-between pt-14">
              <View>
                <Text
                  className="text-xl font-extrabold"
                  style={{ color: GREEN_TEXT }}
                >
                  TN Tech Connect
                </Text>
                <Text className="mt-1 text-xs font-semibold text-green-700">
                  Seller Menu
                </Text>
              </View>

              {/* CLOSE ICON */}
              <Pressable
                onPress={closeMenu}
                className="h-9 w-9 items-center justify-center rounded-full bg-green-100"
              >
                <Ionicons name="close" size={18} color={GREEN_TEXT} />
              </Pressable>
            </View>

            {/* SELL PHONE */}
            <DropdownItem
              label="Sell Phone"
              icon="phone-portrait-outline"
              open={expanded === "phone"}
              onToggle={() => toggle("phone")}
              onSell={() => goSell("/SelectBrand")}
              onProducts={() => goProducts("phone")}
            />

            {/* SELL TABLET */}
            <DropdownItem
              label="Sell Tablet"
              icon="tablet-portrait-outline"
              open={expanded === "tablet"}
              onToggle={() => toggle("tablet")}
              onSell={() => goSell("/SellTablet")}
              onProducts={() => goProducts("tablet")}
            />

            {/* SELL LAPTOP */}
            <DropdownItem
              label="Sell Laptop"
              icon="laptop-outline"
              open={expanded === "laptop"}
              onToggle={() => toggle("laptop")}
              onSell={() => goSell("/SellLaptop")}
              onProducts={() => goProducts("laptop")}
            />

            {/* FOOTER */}
            <View className="absolute bottom-8 left-5">
              <Text className="text-[11px] font-semibold text-gray-400">
                © TN Tech Connect Seller App
              </Text>
            </View>
          </View>

          {/* OVERLAY CLOSE */}
          <Pressable className="flex-1" onPress={closeMenu} />
        </View>
      </Modal>
    </>
  );
}

/* ---------- DROPDOWN ITEM ---------- */
function DropdownItem({
  label,
  icon,
  open,
  onToggle,
  onSell,
  onProducts,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  open: boolean;
  onToggle: () => void;
  onSell: () => void;
  onProducts: () => void;
}) {
  return (
    <View className="mb-6">
      {/* MAIN ROW */}
      <Pressable
        onPress={onToggle}
        className="flex-row items-center py-1"
      >
        <Ionicons name={icon} size={22} color={GREEN_PRIMARY} />
        <Text
          className="ml-4 flex-1 text-[15px] font-semibold"
          style={{ color: GREEN_TEXT }}
        >
          {label}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#9CA3AF"
        />
      </Pressable>

      {/* DROPDOWN ACTIONS */}
      {open && (
        <View
          className="mt-3 ml-9 rounded-xl px-3 py-2"
          style={{ backgroundColor: GREEN_LIGHT }}
        >
          <Pressable onPress={onSell} className="py-2 flex-row items-center">
            <Ionicons name="cash-outline" size={16} color={GREEN_TEXT} />
            <Text
              className="ml-2 text-sm font-semibold"
              style={{ color: GREEN_TEXT }}
            >
              Sell Product
            </Text>
          </Pressable>

          <Pressable onPress={onProducts} className="py-2 flex-row items-center">
            <Ionicons name="grid-outline" size={16} color={GREEN_TEXT} />
            <Text
              className="ml-2 text-sm font-semibold"
              style={{ color: GREEN_TEXT }}
            >
              View Products
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
