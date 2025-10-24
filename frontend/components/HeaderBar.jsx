// components/HeaderBar.jsx
import React, { useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { navigate as globalNavigate, navigationRef } from "../navigation/NavigationService";

const COLORS = {
  base: "#F5F7FA",
  blue: "#4A90E2",
  green: "#10B981",
};

export default function HeaderBar({ navigation, unreadCount = 0, onBack }) {
  const { user, userRole, setUserRole } = useContext(AuthContext);
  const slide = useRef(new Animated.Value(-24)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const backPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 550, useNativeDriver: false }),
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: false }),
    ]).start();

    // notifications/chat animation removed
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [unreadCount]);

  const badgeScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const backScale = backPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation?.canGoBack?.()) return navigation.goBack();
    navigation?.navigate?.("Home");
  };

  // Short tap: navigate directly to ProfileMain. Long press: show quick action menu.
  const navigateToProfileNested = (nestedScreen) => {
    // Prefer global navigationRef if available
    try {
      if (navigationRef && navigationRef.isReady && navigationRef.isReady()) {
        globalNavigate("Profile", { screen: nestedScreen });
        return true;
      }
    } catch (err) {
      // fall through to local navigation
    }

    try {
      // climb to the top-most navigator
      let nav = navigation;
      while (nav && typeof nav.getParent === "function" && nav.getParent()) {
        nav = nav.getParent();
      }
      const targetNav = nav || navigation;
      if (typeof targetNav.navigate === "function") {
        targetNav.navigate("Profile", { screen: nestedScreen });
        return true;
      }
    } catch (err) {
      console.warn("Profile navigation helper failed:", err);
    }

    // last-resort: try plain navigate on provided navigation prop
    try {
      navigation && navigation.navigate && navigation.navigate("Profile", { screen: nestedScreen });
      return true;
    } catch (e) {
      console.warn("Fallback Profile navigate failed:", e);
    }

    return false;
  };

  const handleProfilePress = () => {
    navigateToProfileNested("ProfileMain");
  };

  const handleProfileLongPress = () => {
    Alert.alert(
      "Profile",
      "Choose an action",
      [
        { text: "View Profile", onPress: () => navigateToProfileNested("ProfileMain") },
        { text: "Change Role", onPress: () => navigateToProfileNested("RoleManagement") },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  function getInitials(user) {
    try {
      const name = (user && (user.displayName || user.name || user.email)) || '';
      if (!name) return 'HI';
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } catch (e) {
      return 'HI';
    }
  }

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

        {/* Right: profile only */}
        <View style={styles.right}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleProfilePress}
              onLongPress={handleProfileLongPress}
              style={styles.profileBtn}
              delayLongPress={400}
            >
              <Animated.View style={[styles.profileRing, { transform: [{ scale: backScale }] }]}> 
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
                ) : (
                  <View style={styles.initialsWrap}>
                    <Text style={styles.initialsText}>{getInitials(user)}</Text>
                  </View>
                )}
              </Animated.View>
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
  right: { 
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationBtn: {
    position: "relative",
    padding: 8,
  },
  profileBtn: {
    padding: 4,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  profileRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    ...Platform.select({ android: { elevation: 4 } }),
  },
  initialsWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: COLORS.green,
    fontWeight: '700',
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
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
