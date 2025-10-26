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

export default function TrustedBottomNavBar({ state, navigation }) {
  const handlePress = (routeName) => {
    if (routeName !== state.routeNames[state.index]) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={styles.container}>
      {/* Trusted Person Dashboard */}
      <TabIcon
        icon={<Ionicons name="grid" size={26} />}
        active={state.routeNames[state.index] === "TrustedDashboard"}
        onPress={() => handlePress("TrustedDashboard")}
        label="Dashboard"
      />

      {/* Youth User Analytics */}
      <TabIcon
        icon={<Ionicons name="analytics" size={26} />}
        active={state.routeNames[state.index] === "TrustedAnalytics"}
        onPress={() => handlePress("TrustedAnalytics")}
        label="Analytics"
      />

      {/* Chat */}
      <TabIcon
        icon={<Ionicons name="chatbubble" size={26} />}
        active={state.routeNames[state.index] === "Chat"}
        onPress={() => handlePress("Chat")}
        label="Chat"
      />

      {/* Profile */}
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
          color: active ? "#10B981" : "#6B7280",
        })}
        {label && (
          <Text style={[styles.tabLabel, { color: active ? "#10B981" : "#6B7280" }]}>
            {label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// Removed SOS FAB as it's not needed in the new design

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
// Removed FAB styles as they're not needed
});
