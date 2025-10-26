import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

/* ───────────────  CARD COMPONENT  ─────────────── */
function HubCard({ icon, title, onPress, description }) {
  const [highlighted, setHighlighted] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = (v) =>
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();

  const onIn = () => {
    setHighlighted(true);
    animateTo(1.05);
    Animated.timing(opacity, {
      toValue: 0.9,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  
  const onOut = () => {
    setHighlighted(false);
    animateTo(1);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      {...(Platform.OS === "web"
        ? { onHoverIn: onIn, onHoverOut: onOut }
        : {})}
      android_ripple={{ color: "rgba(99, 102, 241, 0.1)", borderless: false }}
      style={({ pressed }) => [
        styles.card,
        (pressed || highlighted) && styles.cardActive,
      ]}
    >
      <Animated.View 
        style={[
          styles.cardContent, 
          { 
            transform: [{ scale }],
            opacity 
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.cardIcon}>{icon}</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        {description && (
          <Text style={styles.cardDescription}>{description}</Text>
        )}
        <View style={styles.cardArrow}>
          <Ionicons name="chevron-forward" size={16} color="#6366F1" />
        </View>
      </Animated.View>
    </Pressable>
  );
}

/* ───────────────  SECTION HEADER COMPONENT  ─────────────── */
function SectionHeader({ title, subtitle, icon }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

/* ───────────────  MAIN SCREEN  ─────────────── */
export default function ActivityScreen({ navigation }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const activities = [
    {
      key: "Meditation",
      icon: "🧘‍♀️",
      title: "Meditation",
      description: "Find inner peace",
      go: () => navigation.navigate("Meditation"),
    },
    {
      key: "Journaling",
      icon: "📓",
      title: "Journaling",
      description: "Express your thoughts",
      go: () => navigation.navigate("Journal"),
    },
    {
      key: "Exercise",
      icon: "💪",
      title: "Exercise",
      description: "Boost your energy",
      go: () => navigation.navigate("ExerciseList"),
    },
    {
      key: "Music",
      icon: "🎵",
      title: "Music Therapy",
      description: "Heal with sound",
      go: () => navigation.navigate("Music"),
    },
  ];

  const tools = [
    {
      key: "GoalSetup",
      icon: "🎯",
      title: "Set Goals",
      description: "Plan your journey",
      go: () => navigation.navigate("GoalSetup"),
    },
    {
      key: "Progress",
      icon: "📊",
      title: "Progress",
      description: "Track achievements",
      go: () => navigation.navigate("Progress"),
    },
    {
      key: "Rewards",
      icon: "🏆",
      title: "Rewards",
      description: "Celebrate wins",
      go: () => navigation.navigate("Rewards"),
    },
    
  ];

  const quickActions = [
    {
      key: "Breathing",
      icon: "🌬️",
      title: "Breathing",
      description: "Quick calm session",
      go: () => navigation.navigate("Breathing"),
    },
    {
      key: "MoodCheck",
      icon: "😊",
      title: "Mood Check",
      description: "How are you feeling?",
      go: () => navigation.navigate("MoodCheck"),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient 
        colors={["#4A90E2", "#10B981"]} 
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.headerWrap,
          {
            opacity: headerOpacity,
            transform: [{ scale: headerScale }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>🌿</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.headerTitle}>Wellness Hub</Text>
          </View>
          <Pressable style={styles.profileButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="flame" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="time" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.statNumber}>24m</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {/* Activities Section */}
        <View style={styles.block}>
          <SectionHeader 
            title="Daily Activities" 
            subtitle="Build healthy habits"
            icon="🌟"
          />
          <View style={styles.grid}>
            {activities.map((a) => (
              <View key={a.key} style={styles.cell}>
                <HubCard 
                  icon={a.icon} 
                  title={a.title} 
                  description={a.description}
                  onPress={a.go} 
                />
              </View>
            ))}
          </View>
        </View>

        {/* Tools Section */}
        <View style={styles.block}>
          <SectionHeader 
            title="Tools & Goals" 
            subtitle="Track and achieve your goals"
            icon="🛠️"
          />
          <View style={styles.grid}>
            {tools.map((t) => (
              <View key={t.key} style={styles.cell}>
                <HubCard 
                  icon={t.icon} 
                  title={t.title} 
                  description={t.description}
                  onPress={t.go} 
                />
              </View>
            ))}
          </View>
        </View>

        {/* Motivation Section */}
        <View style={styles.motivationCard}>
          <View style={styles.motivationContent}>
            <Text style={styles.motivationQuote}>
              "Small daily improvements are the key to staggering long-term results"
            </Text>
            <View style={styles.motivationAuthor}>
              <View style={styles.authorDivider} />
              <Text style={styles.authorName}>– Your Wellness Journey</Text>
            </View>
          </View>
        </View>

        {/* Footer spacing */}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

/* ───────────────  STYLES  ─────────────── */
const GAP = 16;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 140,
    paddingBottom: 40,
    gap: 24,
  },

  /* Header Section */
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },

  /* Stats Overview */
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
    backdropFilter: 'blur(10px)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },

  /* Section Headers */
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },

  /* Section Containers */
  block: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -GAP / 2,
  },
  cell: {
    width: "50%",
    paddingHorizontal: GAP / 2,
    marginBottom: GAP,
  },

  /* Cards */
  card: {
    height: 140,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: "#F5F7FA",
    shadowColor: "#F5F7FA",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardContent: {
    alignItems: "flex-start",
    justifyContent: "space-between",
    height: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 24,
    textAlign: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    lineHeight: 16,
  },
  cardArrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Motivation Card */
  motivationCard: {
    backgroundColor: '#4A90E2',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  motivationContent: {
    alignItems: 'center',
  },
  motivationQuote: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  motivationAuthor: {
    alignItems: 'center',
  },
  authorDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});