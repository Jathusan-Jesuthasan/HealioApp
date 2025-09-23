// frontend/components/BottomNavBar.js
import React, { useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function BottomNavBar({ state, navigation }) {
  const handlePress = (routeName) => {
    navigation.navigate(routeName);
  };

  return (
    <View style={styles.container}>
      {/* Home */}
      <TabIcon
        icon={<Ionicons name="home" size={26} />}
        active={state.index === 0}
        onPress={() => handlePress("Home")}
      />

      {/* Chat */}
      <TabIcon
        icon={<Feather name="message-circle" size={26} />}
        active={state.index === 1}
        onPress={() => handlePress("Chat")}
      />

      {/* Floating Mood Log Button with Glow */}
      <MoodFab onPress={() => handlePress("MoodLog")} />

      {/* Activity */}
      <TabIcon
        icon={<Feather name="bar-chart-2" size={26} />}
        active={state.index === 2}
        onPress={() => handlePress("Activity")}
      />

      {/* Profile */}
      <TabIcon
        icon={<Feather name="user" size={26} />}
        active={state.index === 3}
        onPress={() => handlePress("Profile")}
      />
    </View>
  );
}

/* 🔹 Animated Tab Icon */
function TabIcon({ icon, active, onPress }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    scale.value = withSpring(active ? 1.3 : 1);
  }, [active]);

  return (
    <TouchableOpacity style={styles.tabButton} activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={animatedStyle}>
        {React.cloneElement(icon, {
          color: active ? "#377DFF" : "#6B7280",
        })}
      </Animated.View>
    </TouchableOpacity>
  );
}

/* 🔹 Glowing Mood FAB */
function MoodFab({ onPress }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.6, { duration: 1500 }),
      -1, // infinite
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value, // fade as it grows
  }));

  return (
    <TouchableOpacity style={styles.fabWrapper} activeOpacity={0.9} onPress={onPress}>
      <Animated.View style={[styles.glowCircle, pulseStyle]} />
      <View style={styles.fabButton}>
        <Feather name="plus" size={32} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    height: 70,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fabWrapper: {
    position: "absolute",
    top: -30,
    alignSelf: "center",
  },
  glowCircle: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B98155", // semi-transparent green glow
  },
  fabButton: {
    backgroundColor: "#10B981",
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
});
