// frontend/screens/OnboardingScreen.js
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

// Updated color theme
const COLORS = {
  // Primary (60%) - Soft light gray-blue
  primary: "#F5F7FA",
  primaryLight: "#FFFFFF",
  primaryDark: "#E4E7EB",
  
  // Secondary (30%) - Calm blue
  secondary: "#4A90E2",
  secondaryLight: "#63A0E8",
  secondaryDark: "#3A7BC8",
  
  // Accent (10%) - Emerald green
  accent: "#10B981",
  accentLight: "#34D399",
  accentDark: "#0D9C6D",
  
  // Background and surface colors
  bg: "#F5F7FA",
  card: "#FFFFFF",
  text: "#1E293B",
  textLight: "#64748B",
  textLighter: "#94A3B8",
  border: "#E2E8F0",
};

const SLIDES = [
  {
    id: "1",
    title: "Track Your\nEmotional Journey",
    description: "Easily log your daily mood with intuitive emojis and notes. Build meaningful insights into your mental wellbeing.",
    image: require("../../assets/healio_onboard_mood.png"),
    icon: "😊",
    gradient: [COLORS.secondary, COLORS.secondaryLight],
  },
  {
    id: "2",
    title: "Discover\nPersonal Insights",
    description: "Visualize your progress with beautiful charts and receive personalized recommendations for your mental health journey.",
    image: require("../../assets/healio_onboard_insights.png"),
    icon: "📊",
    gradient: [COLORS.accent, COLORS.accentLight],
  },
  {
    id: "3",
    title: "Find Support\nWhen Needed",
    description: "Connect with trusted contacts and access helpful resources tailored to support your mental wellness.",
    image: require("../../assets/healio_onboard_support.png"),
    icon: "🤝",
    gradient: ["#8B5CF6", "#A78BFA"],
  },
];

export default function OnboardingScreen({ navigation, route }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const setHasOnboarded = route?.params?.setHasOnboarded;

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasOnboarded", "1");
      if (setHasOnboarded) setHasOnboarded(true);
      navigation.replace("Login");
    } catch (e) {
      console.error("Error saving onboarding flag:", e);
      navigation.replace("Login");
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    animateButton();
    if (index < SLIDES.length - 1) {
      const nextIndex = index + 1;
      const offset = nextIndex * width;
      try {
        ref.current?.scrollToOffset({ offset, animated: true });
      } catch (e) {
        try {
          ref.current?.scrollToIndex({ index: nextIndex, animated: true });
        } catch (err) {
          console.warn('Failed to scroll to next onboarding slide', err);
        }
      }
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    animateButton();
    finishOnboarding();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      setIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const getItemLayout = (_, i) => ({ length: width, offset: width * i, index: i });

  const renderItem = ({ item, index: itemIndex }) => {
    const inputRange = [
      (itemIndex - 1) * width,
      itemIndex * width,
      (itemIndex + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          {/* Background Gradient Blob */}
          <View style={styles.gradientBlob}>
            <LinearGradient
              colors={item.gradient}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>

          {/* Icon Badge */}
          <MotiView
            from={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 200 }}
            style={styles.iconBadge}
          >
            <Text style={styles.iconText}>{item.icon}</Text>
          </MotiView>

          {/* Image */}
          <Image source={item.image} style={styles.image} resizeMode="contain" />

          {/* Content */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 400 }}
            style={styles.textContainer}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </MotiView>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

      {/* Animated Background */}
      <Animated.View style={styles.background}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.header}
      >
        <View style={styles.topBar}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>Healio</Text>
          </View>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          {SLIDES.map((_, i) => (
            <MotiView
              key={i}
              style={[
                styles.progressItem,
                i <= index && styles.progressItemActive,
              ]}
              animate={{
                width: i <= index ? 32 : 8,
                backgroundColor: i <= index ? COLORS.secondary : COLORS.border,
              }}
              transition={{ type: 'timing', duration: 300 }}
            />
          ))}
        </View>
      </MotiView>

      {/* Slides */}
      <Animated.FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
        getItemLayout={getItemLayout}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />

      {/* Bottom Section */}
      <MotiView
        from={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.bottomSection}
      >
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => (
            <MotiView
              key={i}
              style={[
                styles.dot,
                i === index ? styles.dotActive : styles.dotInactive,
              ]}
              animate={{
                width: i === index ? 32 : 8,
                backgroundColor: i === index ? COLORS.secondary : COLORS.border,
              }}
              transition={{ type: 'timing', duration: 300 }}
            />
          ))}
        </View>

        {/* Next Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.secondaryLight]}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>
                {index === SLIDES.length - 1 ? "Get Started" : "Continue"}
              </Text>
              <View style={styles.nextButtonIcon}>
                <Text style={styles.nextButtonIconText}>
                  {index === SLIDES.length - 1 ? "🎉" : "→"}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skipText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    flexDirection: "row",
    gap: 4,
    height: 4,
  },
  progressItem: {
    height: 4,
    borderRadius: 2,
  },
  progressItemActive: {
    backgroundColor: COLORS.secondary,
  },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  gradientBlob: {
    position: 'absolute',
    top: '15%',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    opacity: 0.1,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.4,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  iconText: {
    fontSize: 32,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: COLORS.text,
    lineHeight: 38,
    marginBottom: 16,
  },
  desc: {
    fontSize: 16,
    textAlign: "center",
    color: COLORS.textLight,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
    gap: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: COLORS.secondary,
  },
  dotInactive: {
    backgroundColor: COLORS.border,
  },
  nextButton: {
    width: '100%',
    borderRadius: 16,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  nextButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});