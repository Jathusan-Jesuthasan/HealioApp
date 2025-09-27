import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { Colors } from '../utils/Colors';

const ProgressBarCustom = ({ progress = 0, showLabel = true }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Dynamic color depending on progress
  const getProgressColor = () => {
    if (progress < 0.3) return Colors.danger; // red
    if (progress < 0.7) return Colors.warning; // orange
    return Colors.accent; // green
  };

  return (
    <View style={styles.wrapper}>
      {showLabel && <Text style={styles.label}>{Math.round(progress * 100)}%</Text>}
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.progress,
            { width: widthInterpolated, backgroundColor: getProgressColor() },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 8,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  container: {
    height: 12,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 10,
  },
});

export default ProgressBarCustom;
