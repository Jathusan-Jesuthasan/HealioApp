// frontend/screens/OnboardingScreen.js
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// 👉 Replace these with your actual images in assets/
const SLIDES = [
  {
    id: '1',
    title: 'Log Your Daily\nMood',
    description:
      'Quickly record how you feel using emojis, sliders, or short notes. Build a clear picture of your emotional journey.',
    image: require('../assets/healio_onboard_mood.png'),
  },
  {
    id: '2',
    title: 'Track Progress\n& Insights',
    description:
      'See weekly and monthly trends, personalized insights, and helpful tips to stay balanced.',
    image: require('../assets/healio_onboard_insights.png'),
  },
  {
    id: '3',
    title: 'Get Support\nWhen You Need',
    description:
      'Connect with trusted contacts and access coping activities tailored to your needs.',
    image: require('../assets/healio_onboard_support.png'),
  },
];

export default function OnboardingScreen({ navigation, route }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  // ⬇️ setter passed from App.js
  const setHasOnboarded = route?.params?.setHasOnboarded;

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasOnboarded', '1');
      if (setHasOnboarded) setHasOnboarded(true);
      navigation.replace('Login');
    } catch (e) {
      console.error('Error saving onboarding flag:', e);
      navigation.replace('Login'); // fallback
    }
  };

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finishOnboarding(); // ✅ save + go to Login
    }
  };

  const handleSkip = () => finishOnboarding();

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      setIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* top bar */}
      <View style={styles.topBar}>
        <Text style={styles.counter}>
          {index + 1}/{SLIDES.length}
        </Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* slides */}
      <FlatList
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
      />

      {/* dots + next */}
      <View style={styles.bottomBar}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>{index === SLIDES.length - 1 ? 'Start' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BLUE = '#377DFF';
const TEXT = '#111827';
const SUB = '#6B7280';
const BG = '#F7F9FF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    color: TEXT,
    fontWeight: '600',
  },
  skip: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  image: {
    width: width * 0.9,
    height: width * 0.9,
    marginTop: 10,
  },
  title: {
    marginTop: 8,
    fontSize: 32,
    textAlign: 'center',
    color: BLUE,
    fontWeight: '800',
    lineHeight: 38,
  },
  desc: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: SUB,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 6,
  },
  dotActive: {
    backgroundColor: BLUE,
    width: 28,
  },
  dotInactive: {
    backgroundColor: '#D1D5DB',
  },
  nextBtn: {},
  nextText: {
    color: BLUE,
    fontSize: 18,
    fontWeight: '700',
  },
});
