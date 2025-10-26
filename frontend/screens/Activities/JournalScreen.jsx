import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import api from "../../config/api";
import { showSyncedToast } from "../../utils/toastUtils";
import { useActivity } from "../../context/ActivityContext";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Your app theme colors
const COLORS = {
  primary: "#F5F7FA",
  secondary: "#4A90E2",
  accent: "#10B981",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  white: "#FFFFFF",
  border: "#E2E8F0",
  surface: "#FFFFFF",
};

export default function JournalScreen() {
  const [entry, setEntry] = useState("");
  const [journals, setJournals] = useState([]);
  const [mood, setMood] = useState("neutral");
  const [characterCount, setCharacterCount] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const inputScale = useRef(new Animated.Value(1)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  
  const { triggerRefresh } = useActivity();
  const userId = "demo_user";

  // Mood options
  const moodOptions = [
    { id: "amazing", emoji: "😄", label: "Amazing", color: "#10B981" },
    { id: "good", emoji: "😊", label: "Good", color: "#4A90E2" },
    { id: "neutral", emoji: "😐", label: "Neutral", color: "#F59E0B" },
    { id: "down", emoji: "😔", label: "Down", color: "#EF4444" },
    { id: "anxious", emoji: "😰", label: "Anxious", color: "#8B5CF6" },
  ];

  /* ---------------- Animations ---------------- */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* ---------------- Load Journals ---------------- */
  useEffect(() => {
    const loadJournals = async () => {
      const saved = await AsyncStorage.getItem("journals");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sort by timestamp descending
        const sorted = parsed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setJournals(sorted);
      }
    };
    loadJournals();
  }, []);

  /* ---------------- Character Count ---------------- */
  useEffect(() => {
    setCharacterCount(entry.length);
    
    // Input focus animation
    if (entry.length > 0 && !isWriting) {
      setIsWriting(true);
      Animated.spring(inputScale, {
        toValue: 1.02,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else if (entry.length === 0 && isWriting) {
      setIsWriting(false);
      Animated.spring(inputScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [entry]);

  /* ---------------- Save Entry ---------------- */
  const handleSave = async () => {
    if (!entry.trim()) {
      Alert.alert("Empty Entry", "Please write something before saving.");
      return;
    }

    const now = new Date();
    const newEntry = {
      id: Date.now().toString(),
      text: entry.trim(),
      date: now.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      mood: mood,
      timestamp: now.getTime(),
      wordCount: entry.trim().split(/\s+/).filter(word => word.length > 0).length,
    };

    try {
      // Button press animation
      Animated.sequence([
        Animated.spring(saveButtonScale, {
          toValue: 0.95,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(saveButtonScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();

      const updated = [newEntry, ...journals];
      setJournals(updated);
      await AsyncStorage.setItem("journals", JSON.stringify(updated));

      // Send to MongoDB
      await api.post("/api/journals/add", {
        userId,
        text: newEntry.text,
        mood: mood,
        date: now,
        wordCount: newEntry.wordCount,
      });

      showSyncedToast("📝 Journal entry saved!");
      triggerRefresh();
      
      // Reset form
      setEntry("");
      setMood("neutral");
      setCharacterCount(0);
      
    } catch (err) {
      console.error("Journal save error:", err);
      Alert.alert("Save Error", "Could not save journal entry.");
    }
  };

  /* ---------------- UI Components ---------------- */
  const MoodSelector = () => (
    <Animated.View 
      style={[
        styles.moodSection,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.moodTitle}>How are you feeling?</Text>
      <View style={styles.moodGrid}>
        {moodOptions.map((moodOption) => (
          <TouchableOpacity
            key={moodOption.id}
            style={[
              styles.moodOption,
              mood === moodOption.id && [
                styles.moodOptionActive,
                { borderColor: moodOption.color }
              ]
            ]}
            onPress={() => setMood(moodOption.id)}
          >
            <Text style={styles.moodEmoji}>{moodOption.emoji}</Text>
            <Text style={[
              styles.moodLabel,
              mood === moodOption.id && { color: moodOption.color }
            ]}>
              {moodOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const JournalStats = () => {
    const totalEntries = journals.length;
    const totalWords = journals.reduce((sum, journal) => sum + (journal.wordCount || 0), 0);
    const avgWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="book-open" size={20} color={COLORS.secondary} />
          <Text style={styles.statNumber}>{totalEntries}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="text" size={20} color={COLORS.accent} />
          <Text style={styles.statNumber}>{totalWords}</Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="chart-line" size={20} color={COLORS.textSecondary} />
          <Text style={styles.statNumber}>{avgWords}</Text>
          <Text style={styles.statLabel}>Avg/Entry</Text>
        </View>
      </View>
    );
  };

  const getMoodEmoji = (moodId) => {
    return moodOptions.find(m => m.id === moodId)?.emoji || "😐";
  };

  const getMoodColor = (moodId) => {
    return moodOptions.find(m => m.id === moodId)?.color || COLORS.textTertiary;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
      
      <LinearGradient 
        colors={["#F0F7FF", "#F8FAFC", "#FFFFFF"]} 
        style={styles.background}
      >
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View 
              style={[
                styles.header,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.title}>Daily Journal</Text>
                  <Text style={styles.subtitle}>
                    Reflect on your thoughts and feelings
                  </Text>
                </View>
                <TouchableOpacity style={styles.infoButton}>
                  <Ionicons name="information-circle-outline" size={24} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Stats Overview */}
            {journals.length > 0 && <JournalStats />}

            {/* Mood Selection */}
            <MoodSelector />

            {/* Journal Input */}
            <Animated.View 
              style={[
                styles.inputContainer,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: inputScale }]
                }
              ]}
            >
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Today's Reflection</Text>
                <Text style={styles.characterCount}>
                  {characterCount}/5000
                </Text>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="What's on your mind? Reflect on your day, thoughts, feelings, or anything you'd like to remember..."
                placeholderTextColor={COLORS.textTertiary}
                value={entry}
                onChangeText={setEntry}
                multiline
                maxLength={5000}
                textAlignVertical="top"
              />
              
              <View style={styles.inputFooter}>
                <View style={styles.wordCount}>
                  <Feather name="file-text" size={14} color={COLORS.textTertiary} />
                  <Text style={styles.wordCountText}>
                    {entry.trim().split(/\s+/).filter(word => word.length > 0).length} words
                  </Text>
                </View>
                <View style={styles.currentMood}>
                  <Text style={styles.currentMoodText}>
                    Mood: {getMoodEmoji(mood)}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Save Button */}
            <Animated.View 
              style={[
                styles.saveSection,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
                <TouchableOpacity 
                  style={[
                    styles.saveButton,
                    !entry.trim() && styles.saveButtonDisabled
                  ]}
                  onPress={handleSave}
                  disabled={!entry.trim()}
                >
                  <Ionicons name="save" size={20} color={COLORS.white} />
                  <Text style={styles.saveButtonText}>
                    Save Journal Entry
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            {/* Recent Entries */}
            {journals.length > 0 && (
              <Animated.View 
                style={[
                  styles.historySection,
                  { 
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Entries</Text>
                  <Text style={styles.entriesCount}>{journals.length} total</Text>
                </View>
                
                <FlatList
                  data={journals.slice(0, 5)}
                  scrollEnabled={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.entryCard}>
                      <View style={styles.entryHeader}>
                        <View style={styles.entryMood}>
                          <Text style={styles.entryMoodEmoji}>
                            {getMoodEmoji(item.mood)}
                          </Text>
                        </View>
                        <View style={styles.entryInfo}>
                          <Text style={styles.entryDate}>{item.date}</Text>
                          <Text style={styles.entryTime}>{item.time}</Text>
                        </View>
                        <View style={styles.entryStats}>
                          <Text style={styles.entryWordCount}>
                            {item.wordCount || 0} words
                          </Text>
                        </View>
                      </View>
                      <Text 
                        style={styles.entryText}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {item.text}
                      </Text>
                    </View>
                  )}
                />
              </Animated.View>
            )}

            {/* Empty State */}
            {journals.length === 0 && (
              <Animated.View 
                style={[
                  styles.emptyState,
                  { 
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <MaterialCommunityIcons 
                  name="book-open-outline" 
                  size={80} 
                  color={COLORS.border} 
                />
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptyText}>
                  Start writing to begin your journaling journey. 
                  Your thoughts are worth remembering.
                </Text>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  moodSection: {
    marginBottom: 24,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
  },
  moodOptionActive: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  wordCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordCountText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  currentMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentMoodText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  saveSection: {
    marginBottom: 32,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
    shadowColor: COLORS.textTertiary,
    shadowOpacity: 0.2,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  historySection: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  entriesCount: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  entryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryMood: {
    marginRight: 12,
  },
  entryMoodEmoji: {
    fontSize: 20,
  },
  entryInfo: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  entryStats: {
    alignItems: 'flex-end',
  },
  entryWordCount: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  entryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});