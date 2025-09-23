// components/HeaderBar.jsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  base: "#F5F7FA",
  blue: "#4A90E2",
  green: "#10B981",
};

export default function HeaderBar({ navigation, unreadCount = 0, onBack }) {
  const slide = useRef(new Animated.Value(-24)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const bellBounce = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const backPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 550, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bellBounce, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(bellBounce, { toValue: 0, duration: 450, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [unreadCount]);

  const bellScale = bellBounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const badgeScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const backScale = backPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation?.canGoBack?.()) return navigation.goBack();
    navigation?.navigate?.("Home");
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.wrap}>
      {/* Background gradient + curve */}
      <View style={styles.bgWrap}>
        <LinearGradient
          colors={[COLORS.base, "#EAF1FE", COLORS.blue]}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
        <Svg width="100%" height={32} viewBox="0 0 375 32" style={styles.curve} preserveAspectRatio="none">
          <Path
            d="M0,0 L0,16 C60,36 120,36 188,18 C255,1 315,1 375,16 L375,0 Z"
            fill={COLORS.base}
            opacity={0.9}
          />
        </Svg>
        <View style={styles.greenBlob} />
      </View>

      {/* Foreground */}
      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: slide }] }]}>
        {/* Left: back + logo together */}
        <View style={styles.left}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleBack}
            onPressIn={() => backPulse.setValue(1)}
            onPressOut={() => backPulse.setValue(0)}
            style={styles.backBtn}
          >
            <Animated.View style={{ transform: [{ scale: backScale }] }}>
              <Feather name="chevron-left" size={26} color={COLORS.blue} />
            </Animated.View>
          </TouchableOpacity>

          <Image
            source={require("../assets/healio_logo_Header.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Right: notifications */}
        <View style={styles.right}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation?.navigate?.("Notifications")}
          >
            <Animated.View style={{ transform: [{ scale: bellScale }] }}>
              <Feather name="bell" size={26} color={COLORS.blue} />
            </Animated.View>

            {unreadCount > 0 && (
              <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: COLORS.base, zIndex: 10 },
  bgWrap: { height: 86, position: "relative" },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  curve: { position: "absolute", bottom: -1, left: 0, right: 0 },
  greenBlob: {
    position: "absolute",
    right: -24,
    top: -18,
    width: 120,
    height: 120,
    backgroundColor: COLORS.green,
    opacity: 0.16,
    borderRadius: 60,
    transform: [{ scaleX: 1.4 }],
  },
  content: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 6,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 120, height: 40 },
  right: { padding: 6 },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    ...Platform.select({ android: { elevation: 3 } }),
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.green,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    ...Platform.select({ android: { elevation: 2 } }),
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
