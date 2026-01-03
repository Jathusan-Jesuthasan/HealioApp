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
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

/* ─────────────── MUSIC LIST ─────────────── */
const MUSIC_LIST = [
  /* ───── Ambient / Focus ───── */
  { id: "1", title: "Calm Ocean Waves 🌊", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "2", title: "Peaceful Piano 🎹", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "3", title: "Forest Ambience 🌲", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "4", title: "Focus Beats 🎧", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },

  /* ───── Tamil Instrumental / Classical ───── */
  {
    id: "11",
    title: "Tamil Veena Melody 🎼",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  },
  {
    id: "12",
    title: "Carnatic Flute – Hamsadhwani 🪈",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
  },
  {
    id: "13",
    title: "Temple Bells & Tanpura 🛕",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  },
  {
    id: "14",
    title: "Tamil Classical Lullaby 🌙",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
  },
  {
    id: "15",
    title: "Veena & Flute Fusion (Raaga) 🎶",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
  },

  /* ───── Sleep / Calm ───── */
  { id: "5", title: "Rainy Night 🌧️", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: "6", title: "Gentle Guitar 🎸", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { id: "7", title: "Morning Birds 🐦", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { id: "8", title: "Soft Strings 🎻", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { id: "9", title: "Wind Chimes 🎐", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
  { id: "10", title: "Deep Sleep Tones 💤", uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
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

  const renderItem = ({ item, index }) => {
    const isPlaying = item.id === playingId;
    return (
      <Animated.View style={{ transform: [{ scale: isPlaying ? scaleAnim : 1 }] }}>
        <TouchableOpacity
          style={[styles.trackCard, isPlaying && styles.trackActive]}
          onPress={() => playMusic(item)}
          activeOpacity={0.85}
        >
          <View style={styles.cardContent}>
            <View style={styles.trackInfo}>
              <View style={[styles.iconContainer, isPlaying && styles.iconContainerActive]}>
                <Ionicons 
                  name={isPlaying ? "musical-notes" : "musical-note"} 
                  size={22} 
                  color={isPlaying ? "#10B981" : "#4B9CD3"} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.trackTitle, isPlaying && styles.activeText]}>{item.title}</Text>
                <Text style={styles.trackSubtitle}>{isPlaying ? "Now Playing..." : "Tap to play"}</Text>
              </View>
            </View>
            <View style={styles.playButtonContainer}>
              <Ionicons 
                name={isPlaying ? "pause-circle" : "play-circle"} 
                size={42} 
                color={isPlaying ? "#10B981" : "#4B9CD3"} 
              />
            </View>
          </View>
          {isPlaying && (
            <View style={styles.playingIndicator}>
              <View style={styles.waveDot} />
              <View style={[styles.waveDot, { animationDelay: "0.2s" }]} />
              <View style={[styles.waveDot, { animationDelay: "0.4s" }]} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient 
        colors={["#E0F2FE", "#F0F9FF", "#ffffff"]} 
        style={styles.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Relax & Focus</Text>
            <Text style={styles.headerSubtitle}>Ambient Sounds</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <FlatList
            data={MUSIC_LIST}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#F8FAFC" 
  },
  bg: { 
    flex: 1 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4B9CD3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 4,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContainer: { 
    paddingBottom: 40 
  },
  trackCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginBottom: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  trackActive: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
    shadowColor: "#10B981",
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trackInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(75, 156, 211, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: "rgba(75, 156, 211, 0.2)",
  },
  iconContainerActive: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  textContainer: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  activeText: { 
    color: "#065F46",
    fontWeight: "800",
  },
  trackSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  playButtonContainer: {
    paddingLeft: 12,
  },
  playingIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    height: 24,
  },
  waveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginHorizontal: 4,
    opacity: 0.6,
  },
});