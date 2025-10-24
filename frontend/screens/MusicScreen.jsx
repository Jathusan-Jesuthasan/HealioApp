import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";

/* ───────────────  FAST, MOBILE-FRIENDLY MUSIC LINKS ─────────────── */
const MUSIC_LIST = [
  {
    id: "1",
    title: "Calm Ocean Waves 🌊",
    uri: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_9b1b02a1f5.mp3?filename=ocean-waves.mp3",
  },
  {
    id: "2",
    title: "Peaceful Piano 🎹",
    uri: "https://cdn.pixabay.com/download/audio/2022/02/23/audio_4c43a46dd6.mp3?filename=relaxing-piano.mp3",
  },
  {
    id: "3",
    title: "Forest Ambience 🌲",
    uri: "https://cdn.pixabay.com/download/audio/2021/09/25/audio_forest.mp3?filename=forest-birds.mp3",
  },
  {
    id: "4",
    title: "Focus Beats 🎧",
    uri: "https://cdn.pixabay.com/download/audio/2022/01/30/audio_1dbd9b8f5f.mp3?filename=focus-beats.mp3",
  },
];

export default function MusicScreen() {
  const [playingId, setPlayingId] = useState(null);
  const soundRef = useRef(new Audio.Sound());
  const scaleAnim = useRef(new Animated.Value(1)).current;

  /* ✅ Configure audio mode for iOS & Android */
  useEffect(() => {
    (async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    })();

    return () => stopMusic();
  }, []);

  /* 🎵 Play Music */
  const playMusic = async (music) => {
    try {
      if (playingId === music.id) {
        await stopMusic();
        return;
      }

      await stopMusic();
      const { sound } = await Audio.Sound.createAsync(
        { uri: music.uri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingId(music.id);

      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (err) {
      console.error("🎵 Play error:", err);
      Alert.alert("Playback Error", "Could not load the audio. Please try again.");
    }
  };

  /* ⏹ Stop Music */
  const stopMusic = async () => {
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } catch {}
    setPlayingId(null);
    Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const renderItem = ({ item }) => {
    const isPlaying = item.id === playingId;
    return (
      <TouchableOpacity
        style={[styles.trackCard, isPlaying && styles.trackActive]}
        onPress={() => playMusic(item)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.trackTitle, isPlaying && styles.activeText]}>{item.title}</Text>
          <Text style={styles.trackSubtitle}>{isPlaying ? "Now Playing..." : "Tap to play"}</Text>
        </View>
        <Ionicons
          name={isPlaying ? "pause-circle" : "play-circle"}
          size={38}
          color={isPlaying ? "#10B981" : "#4B9CD3"}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#E0F2FE", "#F0F9FF", "#ffffff"]} style={styles.bg}>
        <Animated.View style={[styles.headerWrap, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>🎶</Text>
          <Text style={styles.title}>Healio Music Therapy</Text>
          <Text style={styles.subtitle}>Relax, focus, or unwind with calming sounds</Text>
        </Animated.View>

        <FlatList
          data={MUSIC_LIST}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  bg: { flex: 1 },
  headerWrap: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emoji: { fontSize: 42, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4, textAlign: "center" },
  trackCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  trackActive: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
    shadowColor: "#10B981",
    shadowOpacity: 0.2,
  },
  trackTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  activeText: { color: "#065F46" },
  trackSubtitle: { fontSize: 13, color: "#6B7280" },
});
