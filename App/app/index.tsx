// app/index.tsx
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "./context/AuthContext";

export default function Index() {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#020617",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user && token) {
    if (user.role === "EMPLOYEE") {
      return <Redirect href="/EmployeeHome" />;
    }

    const profilePercent =
      typeof user.profilePercent === "number" ? user.profilePercent : 0;

    const backendShopCompleted = !!user.shopCompleted;
    const shopCompleted = backendShopCompleted && profilePercent >= 60;

    const firstScreen = shopCompleted ? "/Home" : "/Shop";
    return <Redirect href={firstScreen} />;
  }

  return <Redirect href="/Onboarding" />;
}
