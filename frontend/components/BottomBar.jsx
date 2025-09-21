// /components/BottomBar.jsx
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../utils/Colors";

/**
 * Rounded bottom bar with a floating '+' centered FAB.
 * Left: first 2 routes, Right: remaining routes, FAB → "MoodLog".
 */
export default function BottomBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  const navActive = Colors.navActive ?? Colors.secondary;
  const navIcon = Colors.navIcon ?? Colors.textSecondary;
  const navBg = Colors.navBackground ?? Colors.card;

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

  const onTabPress = (routeName, routeKey, isFocused) => () => {
    const event = navigation.emit({
      type: "tabPress",
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const onTabLongPress = (routeKey) => () => {
    navigation.emit({
      type: "tabLongPress",
      target: routeKey,
    });
  };

  // helper to render a single tab icon
  const TabIcon = ({ route, index }) => {
    const { options } = descriptors[route.key];
    const label = options.tabBarLabel ?? options.title ?? route.name;
    const isFocused = state.index === index;

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarTestID}
        onPress={onTabPress(route.name, route.key, isFocused)}
        onLongPress={onTabLongPress(route.key)}
        style={styles.tab}
        activeOpacity={0.9}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={iconFor(route.name)}
          size={22}
          color={isFocused ? navActive : navIcon}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset }]}>
      <View style={[styles.bar, { backgroundColor: navBg }]}>
        {/* Left slots (first 2 routes) */}
        {state.routes.slice(0, 2).map((route, idx) => (
          <TabIcon key={route.key} route={route} index={idx} />
        ))}

        {/* Floating center '+' */}
        <TouchableOpacity
          onPress={() => navigation.navigate("MoodLog")}
          style={styles.fab}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Add mood"
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Right slots (remaining routes) */}
        {state.routes.slice(2).map((route, i) => {
          const actualIndex = i + 2; // because we sliced after 2
          return <TabIcon key={route.key} route={route} index={actualIndex} />;
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
    borderRadius: 24,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    // subtle shadow
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
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
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
