import React, { useEffect } from "react";
import { TouchableOpacity, StyleSheet, View, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

export default function SOSFab({ onPress }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 1.6 - pulse.value,
  }));

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.wrap}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <View style={styles.button}>
        <Feather name="alert-triangle" size={28} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 20,
    bottom: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(239, 68, 68, 0.22)", // red glow
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    ...Platform.select({
      ios: { shadowColor: "#EF4444", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: {},
    }),
  },
});
