import React, { useEffect, useRef, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { AuthContext } from "../../context/AuthContext";
import api from "../../config/api";

export default function SOSScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const [useLocation, setUseLocation] = useState(true);
  const [coords, setCoords] = useState(null);
  const [count, setCount] = useState(10);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("I need help. Please reach me urgently.");
  const cancelledRef = useRef(false);

  // Big button animation
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withTiming(1.03, { duration: 300, easing: Easing.inOut(Easing.ease) });
  }, []);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Request location (optional)
  useEffect(() => {
    (async () => {
      if (!useLocation) return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setUseLocation(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords(pos.coords);
    })();
  }, [useLocation]);

  // 10-second cancel countdown
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    cancelledRef.current = false;
    setCount(10);
    const t = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(t);
          if (!cancelledRef.current) {
            handleSend(); // auto-send when no cancel
          }
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cancelledRef.current = true;
    navigation.goBack();
  };

  const handleSend = async () => {
    try {
      setSending(true);
      const payload = {
        useLocation,
        lat: coords?.latitude ?? null,
        lon: coords?.longitude ?? null,
        message,
      };
      const { data } = await api.post("/api/sos/send", payload, {
        headers: { Authorization: `Bearer ${userToken}` },
        timeout: 20000,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Alert sent", data?.message || "Trusted contacts have been notified.");
      navigation.goBack();
    } catch (err) {
      console.error("SOS send error:", err?.response?.data || err.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", err?.response?.data?.message || "Could not send alert");
    } finally {
      setSending(false);
    }
  };

  const googleMapsLink =
    coords ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}` : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.subtitle}>
        Pressing SOS will notify your trusted contacts immediately.
      </Text>

      <View style={styles.countWrap}>
        <Text style={styles.countText}>{count}</Text>
        <Text style={styles.countSub}>Auto-send in seconds</Text>
      </View>

      {/* Location toggle */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Share GPS Location</Text>
        <Switch value={useLocation} onValueChange={setUseLocation} thumbColor="#10B981" />
      </View>
      {useLocation && googleMapsLink && (
        <Text style={styles.link} numberOfLines={1}>
          {googleMapsLink}
        </Text>
      )}

      {/* Big red SOS */}
      <Animated.View style={[styles.sosWrap, scaleStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSend}
          disabled={sending}
          style={styles.sosButton}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sosText}>SEND HELP NOW</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.privacyBox}>
        <Text style={styles.privacyTitle}>Privacy Notice</Text>
        <Text style={styles.privacyText}>
          Only your trusted contacts will receive this alert. Your journals
          are never shared.
        </Text>
      </View>
    </View>
  );
}

const PRIMARY = "#F5F7FA";
const SECONDARY = "#4A90E2";
const ACCENT = "#10B981";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY, padding: 20, paddingTop: 30 },
  title: { fontSize: 26, fontWeight: "800", color: SECONDARY, textAlign: "center" },
  subtitle: { textAlign: "center", color: "#334155", marginTop: 6, marginBottom: 16 },
  countWrap: { alignItems: "center", marginTop: 10, marginBottom: 12 },
  countText: { fontSize: 52, fontWeight: "900", color: "#EF4444" },
  countSub: { color: "#64748B" },
  row: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.2)",
  },
  rowLabel: { fontWeight: "700", color: SECONDARY },
  link: { color: "#0ea5e9", marginTop: 6 },
  sosWrap: { alignItems: "center", marginTop: 24 },
  sosButton: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    borderWidth: 8,
    borderColor: "rgba(239,68,68,0.25)",
  },
  sosText: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  cancelBtn: {
    marginTop: 14,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  cancelText: { color: "#0f172a", fontWeight: "700" },
  privacyBox: {
    marginTop: 18,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(74,144,226,0.2)",
  },
  privacyTitle: { fontWeight: "800", color: SECONDARY, marginBottom: 6 },
  privacyText: { color: "#334155" },
});
