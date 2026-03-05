// app/components/SpeedNeedle.tsx
import { Image, View } from "react-native";

interface Props {
  size?: number; // this is the total height of the needle image
}

export default function SpeedNeedle({ size = 80 }: Props) {
  const needleWidth = size * 0.55;

  return (
    <View
      style={{
        width: needleWidth,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={require("../../assets/images/needle.png")}
        resizeMode="contain"
        style={{
          width: needleWidth,
          height: size,
          // move the image slightly up so the black circle is at the center,
          // which matches the rotation pivot and the gauge hub.
          marginTop: -size * 0.68, // tweak between -0.10 and -0.16 if needed
        }}
      />
    </View>
  );
}
