// /components/BottomBar.jsx
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../utils/Colors";

/**
 * Renders a rounded bottom bar with a floating '+' action in the center.
 * Tabs are icon-only (clean like your mock). The FAB navigates to "MoodLog".
 */
export default function BottomBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  const go = (name) => () => navigation.navigate(name);

  // Map route to icon
  const iconFor = (name) => {
    switch (name) {
      case "Dashboard": return "home-outline";
      case "MoodLog":  return "happy-outline";
      case "Trends":   return "analytics-outline";
      case "Reports":  return "document-text-outline";
      case "Settings": return "settings-outline";
      default:         return "ellipse-outline";
    }
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset }]}>
      <View style={styles.bar}>
        {/* Left slots (first half of routes) */}
        {state.routes.slice(0, 2).map((route, index) => {
          const isFocused = state.index === index;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={go(route.name)}
              style={styles.tab}
              activeOpacity={0.9}
            >
              <Ionicons
                name={iconFor(route.name)}
                size={22}
                color={isFocused ? Colors.navActive : Colors.navIcon}
              />
            </TouchableOpacity>
          );
        })}

        {/* Floating center '+' */}
        <TouchableOpacity
          onPress={go("MoodLog")}
          style={styles.fab}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Right slots (remaining routes) */}
        {state.routes.slice(2).map((route, i) => {
          const idx = i + 2;
          const isFocused = state.index === idx;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={go(route.name)}
              style={styles.tab}
              activeOpacity={0.9}
            >
              <Ionicons
                name={iconFor(route.name)}
                size={22}
                color={isFocused ? Colors.navActive : Colors.navIcon}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
  },
  bar: {
    height: 64,
    backgroundColor: Colors.navBackground ?? Colors.card,
    borderRadius: 24,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  tab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    alignSelf: "center",
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent, // green CTA
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});
