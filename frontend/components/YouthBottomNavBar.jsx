import React, { useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
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

export default function YouthBottomNavBar({ state, navigation }) {
  const handlePress = (routeName) => {
    if (routeName !== state.routeNames[state.index]) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={styles.container}>
      {/* Home */}
      <TabIcon
        icon={<Ionicons name="home" size={26} />}
        active={state.routeNames[state.index] === "Home"}
        onPress={() => handlePress("Home")}
        label="Home"
      />

      {/* Coping Activities */}
      <TabIcon
        icon={<Ionicons name="leaf" size={26} />}
        active={state.routeNames[state.index] === "Activity"}
        onPress={() => navigation.reset({
          index: 0,
          routes: [{ name: "Activity" }],
        })}
        label="Activities"
      />

      {/* Floating Mood Log Button */}
      <MoodLogFab onPress={() => handlePress("MoodLog")} />

      {/* Chat */}
      <TabIcon
        icon={<Ionicons name="chatbubble" size={26} />}
        active={state.routeNames[state.index] === "Chat"}
        onPress={() => handlePress("Chat")}
        label="Chat"
      />

      {/* Profile */}
      {/* Community Hub */}
      <TabIcon
        icon={<Ionicons name="people" size={26} />}
        active={state.routeNames[state.index] === "Community"}
        onPress={() => handlePress("Community")}
        label="Community"
      />
    </View>
  );
}

/* 🔹 Animated Tab Icon */
function TabIcon({ icon, active, onPress, label }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    scale.value = withSpring(active ? 1.2 : 1);
  }, [active]);

  return (
    <TouchableOpacity style={styles.tabButton} activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={[animatedStyle, styles.tabContent]}>
        {React.cloneElement(icon, {
          color: active ? "#4A90E2" : "#6B7280",
        })}
        {label && (
          <Text style={[styles.tabLabel, { color: active ? "#4A90E2" : "#6B7280" }]}>
            {label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

/* 🔹 Glowing Mood Log FAB */
function MoodLogFab({ onPress }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.4, { duration: 2000 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  return (
    <TouchableOpacity style={styles.fabWrapper} activeOpacity={0.9} onPress={onPress}>
      <Animated.View style={[styles.pulseRing, pulseStyle]} />
      <View style={styles.fab}>
        <Ionicons name="happy" size={28} color="#fff" />
        <Text style={styles.fabPlus}>+</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: Platform.OS === "ios" ? 20 : 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  fabWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
  },
  pulseRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4A90E2",
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  fabPlus: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#10B981",
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: "center",
    lineHeight: 16,
  },
});
