// components/ProgressRing.jsx
import React, { useMemo } from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function ProgressRing({
  size = 120,
  stroke = 12,
  progress = 0.8, // 0..1
  trackColor = "#E5E7EB",
  progressColor = "#22C55E",
  label = "80",
  subLabel = "Healthy",
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = useMemo(() => c * Math.min(Math.max(progress, 0), 1), [c, progress]);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke={progressColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash}, ${c}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size/2}, ${size/2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827" }}>{label}</Text>
        <Text style={{ fontSize: 12, color: "#6B7280" }}>{subLabel}</Text>
      </View>
    </View>
  );
}
