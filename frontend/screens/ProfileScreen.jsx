// frontend/screens/ProfileScreen.jsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

const COLORS = {
  bg: "#F5F7FA",         // 60%
  blue: "#4A90E2",       // 30%
  green: "#10B981",      // 10%
  text: "#111827",
  sub: "#6B7280",
  card: "#FFFFFF",
  line: "#E5E7EB",
};

export default function ProfileScreen({ navigation, route }) {
  const user = route?.params?.user ?? {
    name: "Demo User",
    email: "demo@healio.app",
    role: "youth", // or "trusted"
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&h=300&fit=facearea&facepad=3&auto=format",
  };

  const insets = useSafeAreaInsets();

  // simple fade/slide entrance
  const fadeHeader = useRef(new Animated.Value(0)).current;
  const slideHeader = useRef(new Animated.Value(20)).current;
  const fadeList = useRef(new Animated.Value(0)).current;
  const slideList = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(fadeHeader, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(slideHeader, { toValue: 0, duration: 550, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeList, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(slideList, { toValue: 0, duration: 550, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fadeHeader, slideHeader, fadeList, slideList]);

  const Card = ({ icon, title, onPress, right }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardRight}>
        {right}
        <Feather name="chevron-right" size={18} color={COLORS.sub} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Gradient header */}
      <LinearGradient
        colors={[COLORS.blue, COLORS.green]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View
          style={{
            opacity: fadeHeader,
            transform: [{ translateY: slideHeader }],
            alignItems: "center",
          }}
        >
          <View style={styles.avatarRing}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.meta}>
            Role:{" "}
            <Text style={{ fontWeight: "700", color: "#fff" }}>
              {user.role === "trusted" ? "Trusted Person" : "Youth"}
            </Text>
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Content list */}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeList,
          transform: [{ translateY: slideList }],
        }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 32 + insets.bottom + 90, // ← keeps last cards above bottom tab
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* General */}
          <Text style={styles.sectionLabel}>General Settings</Text>
          <Card
            icon={<Ionicons name="person-outline" size={18} color={COLORS.blue} />}
            title="Personal Information"
            onPress={() => navigation.navigate("PersonalInfo")}
          />
          <Card
            icon={<Ionicons name="notifications-outline" size={18} color={COLORS.blue} />}
            title="Notifications"
            onPress={() => navigation.navigate("Notifications")}
          />
          <Card
            icon={<Feather name="globe" size={18} color={COLORS.blue} />}
            title="Language"
            right={<Text style={styles.rightText}>English (EN)</Text>}
            onPress={() => navigation.navigate("Language")}
          />
          <Card
            icon={<Feather name="moon" size={18} color={COLORS.blue} />}
            title="Theme (Dark/Light)"
            onPress={() => navigation.navigate("Theme")}
          />
          <Card
            icon={<Feather name="share-2" size={18} color={COLORS.blue} />}
            title="Invite Friends"
            onPress={() => navigation.navigate("InviteFriends")}
          />

          {/* Role-based */}
          {user.role === "youth" ? (
            <>
              <Text style={styles.sectionLabel}>Safety & Support (Youth)</Text>
              <Card
                icon={<Feather name="users" size={18} color={COLORS.blue} />}
                title="Trusted Contacts"
                onPress={() => navigation.navigate("TrustedContacts")}
              />
              <Card
                icon={<Feather name="alert-triangle" size={18} color={COLORS.blue} />}
                title="Emergency Contact"
                onPress={() => navigation.navigate("EmergencyContact")}
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Trusted Person</Text>
              <Card
                icon={<Feather name="user-check" size={18} color={COLORS.blue} />}
                title="Youth Management"
                onPress={() => navigation.navigate("YouthManagement")}
              />
              <Card
                icon={<Feather name="activity" size={18} color={COLORS.blue} />}
                title="Youth Dashboard"
                onPress={() => navigation.navigate("YouthDashboard")}
              />
            </>
          )}

          {/* Security & Community */}
          <Text style={styles.sectionLabel}>Security & Privacy</Text>
          <Card
            icon={<Feather name="shield" size={18} color={COLORS.blue} />}
            title="Security"
            onPress={() => navigation.navigate("Security")}
          />
          <Card
            icon={<Feather name="help-circle" size={18} color={COLORS.blue} />}
            title="Help Center"
            onPress={() => navigation.navigate("HelpCenter")}
          />

          <Text style={styles.sectionLabel}>Community</Text>
          <Card
            icon={<Feather name="book-open" size={18} color={COLORS.blue} />}
            title="Knowledge Hub"
            right={<Badge text="New" />}
            onPress={() => navigation.navigate("KnowledgeHub")}
          />
          <Card
            icon={<Feather name="message-square" size={18} color={COLORS.blue} />}
            title="Messages / Chat"
            onPress={() => navigation.navigate("Messages")}
          />

          {/* Logout */}
          <Text style={styles.sectionLabel}>Account</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("Logout")}
            style={[styles.card, { backgroundColor: "#fdeaea", borderColor: "#fbd5d5" }]}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "#FEE2E2" }]}>
                <Feather name="log-out" size={18} color="#b91c1c" />
              </View>
              <Text style={[styles.cardTitle, { color: "#b91c1c" }]}>Log Out</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#b91c1c" />
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const Badge = ({ text }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    // subtle drop shadow under the arc
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  avatar: { width: "100%", height: "100%", borderRadius: 56 },
  name: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  meta: {
    marginTop: 2,
    color: "rgba(255,255,255,0.9)",
  },

  sectionLabel: {
    marginTop: 16,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E8F2FD", // soft blue tint
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: COLORS.text, fontWeight: "700" },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rightText: { color: COLORS.blue, fontWeight: "700" },

  badge: {
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: COLORS.green, fontWeight: "700", fontSize: 12 },
});
