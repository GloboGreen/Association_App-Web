// app/SuccessPassword.tsx
import { View, Text, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const successImage = require("../assets/images/successful.png");

export default function SuccessPassword() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#2563EB", "#EC4899"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 items-center justify-center px-5"
    >
      <Image
        source={successImage}
        className="w-[250px] h-[250px] mb-6"
        style={{ resizeMode: "contain" }}
      />

      <Text className="text-[28px] font-bold text-white">
        Success!
      </Text>

      <Text className="mt-2 mb-10 text-[14px] text-center text-slate-100">
        Your password has been successfully updated.
      </Text>

      <TouchableOpacity onPress={() => router.replace("/Login")}>
        <LinearGradient
          colors={["#FFFFFF", "#F3F4F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="py-3 px-14 rounded-full"
        >
          <Text className="text-[16px] font-bold text-blue-600 text-center">
            Done
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}
