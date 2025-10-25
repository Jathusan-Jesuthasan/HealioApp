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
import { useNavigation } from "@react-navigation/native";

/* ─────────────── MUSIC LIST ─────────────── */
const MUSIC_LIST = [
  { id: "1", title: "Calm Ocean Waves 🌊", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "2", title: "Peaceful Piano 🎹", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "3", title: "Forest Ambience 🌲", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "4", title: "Focus Beats 🎧", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
];

export default function MusicScreen() {
  const navigation = useNavigation();
  const [playingId, setPlayingId] = useState(null);
  const soundRef = useRef(new Audio.Sound());
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    })();

    return () => stopMusic();
  }, []);

  const playMusic = async (music) => {
    try {
      if (playingId === music.id) {
        await stopMusic();
        return;
      }

      await stopMusic();
      const { sound } = await Audio.Sound.createAsync({ uri: music.uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(music.id);

      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } catch (err) {
      console.error("Play error:", err);
      Alert.alert("Playback Error", "Could not load the audio. Please try again.");
    }
  };

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
        <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={38} color={isPlaying ? "#10B981" : "#4B9CD3"} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#E0F2FE", "#F0F9FF", "#ffffff"]} style={styles.bg}>
        {/* Back Button Only */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <FlatList
          data={MUSIC_LIST}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 100, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  bg: { flex: 1 },
  backButton: { marginLeft: 16, marginTop: 16, marginBottom: 8, padding: 8 },
  trackCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", padding: 16, marginBottom: 14, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: "#E5E7EB" },
  trackActive: { borderColor: "#10B981", backgroundColor: "#ECFDF5", shadowColor: "#10B981", shadowOpacity: 0.2 },
  trackTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  activeText: { color: "#065F46" },
  trackSubtitle: { fontSize: 13, color: "#6B7280" },
});
