// import React from 'react';
// import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
// import { Colors } from '../utils/Colors';

// const Card = ({ children, style, onPress, elevation = 3, borderRadius = 12, padding = 16 }) => {
//   const CardWrapper = onPress ? TouchableOpacity : View;

//   return (
//     <CardWrapper
//       style={[
//         styles.card,
//         {
//           elevation,
//           borderRadius,
//           padding,
//         },
//         Platform.OS === 'ios'
//           ? {
//               shadowColor: '#000',
//               shadowOpacity: 0.15,
//               shadowRadius: elevation * 2,
//               shadowOffset: { width: 0, height: elevation },
//             }
//           : {},
//         style, // allow custom styles
//       ]}
//       onPress={onPress}
//       activeOpacity={0.85}>
//       {children}
//     </CardWrapper>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: Colors.card,
//     marginBottom: 16,
//   },
// });

// export default Card;
import React, { useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Animated,
  Easing,
  Pressable,
  Dimensions
} from 'react-native';
import { Colors } from '../utils/Colors';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const Card = ({ 
  children, 
  style, 
  onPress, 
  onLongPress,
  elevation = 3, 
  borderRadius = 16, 
  padding = 20,
  backgroundColor = Colors.card,
  borderColor,
  borderWidth = 0,
  shadowColor = '#000',
  // New UX props
  animated = true,
  hoverEffect = true,
  rippleEffect = true,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  badge,
  badgeColor = Colors.secondary,
  // Accessibility
  accessibilityLabel,
  accessibilityHint,
  testID
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    if (animated) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 400,
        delay: Math.random() * 200, // Staggered entrance
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const handlePressIn = () => {
    if (disabled || !onPress || !animated) return;
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || !onPress || !animated) return;
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(pressAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePress = () => {
    if (disabled || loading || !onPress) return;
    
    // Quick scale feedback on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      })
    ]).start();
    
    onPress();
  };

  const getIconPosition = () => {
    const positions = {
      'top-right': { top: 16, right: 16 },
      'top-left': { top: 16, left: 16 },
      'bottom-right': { bottom: 16, right: 16 },
      'bottom-left': { bottom: 16, left: 16 },
    };
    return positions[iconPosition] || positions['top-right'];
  };

  const getShadowStyle = () => {
    const baseShadow = {
      shadowColor,
      shadowOpacity: elevation * 0.05,
      shadowRadius: elevation * 3,
      shadowOffset: { width: 0, height: elevation },
    };

    // Enhanced shadows for different elevations
    const shadowPresets = {
      1: { shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
      2: { shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      3: { shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } },
      4: { shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
      5: { shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 5 } },
    };

    return Platform.OS === 'ios' 
      ? { ...baseShadow, ...(shadowPresets[elevation] || shadowPresets[3]) }
      : {};
  };

  const CardWrapper = onPress ? Pressable : View;

  const slideInterpolate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const rippleInterpolate = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [
            { translateY: animated ? slideInterpolate : 0 },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
        }
      ]}
    >
      <CardWrapper
        style={[
          styles.card,
          {
            elevation: Platform.OS === 'android' ? elevation : 0,
            borderRadius,
            padding,
            backgroundColor,
            borderColor,
            borderWidth,
          },
          getShadowStyle(),
          disabled && styles.disabled,
          loading && styles.loading,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        disabled={disabled || loading}
        delayPressIn={0}
        pressRetentionOffset={20}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={onPress ? "button" : "none"}
        accessibilityState={{ disabled: disabled || loading }}
        testID={testID}
      >
        {/* Ripple Effect Overlay */}
        {rippleEffect && onPress && (
          <Animated.View 
            style={[
              styles.ripple,
              {
                opacity: rippleInterpolate,
                transform: [{ scale: rippleInterpolate.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1]
                })}]
              }
            ]} 
          />
        )}

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <Animated.View style={styles.loadingSpinner}>
              <Ionicons name="refresh" size={20} color={Colors.secondary} />
            </Animated.View>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>

        {/* Icon */}
        {icon && (
          <View style={[styles.iconContainer, getIconPosition()]}>
            {typeof icon === 'string' ? (
              <Ionicons name={icon} size={20} color={Colors.textSecondary} />
            ) : (
              icon
            )}
          </View>
        )}

        {/* Badge */}
        {badge && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            {typeof badge === 'string' || typeof badge === 'number' ? (
              <Text style={styles.badgeText}>{badge}</Text>
            ) : (
              badge
            )}
          </View>
        )}
      </CardWrapper>

      {/* Hover effect for web */}
      {Platform.OS === 'web' && hoverEffect && onPress && (
        <style>
          {`
            @media (hover: hover) {
              .card-hover:hover {
                transform: translateY(-2px);
                transition: transform 0.2s ease;
              }
            }
          `}
        </style>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    zIndex: 2,
  },
  disabled: {
    opacity: 0.6,
  },
  loading: {
    opacity: 0.8,
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 1,
    borderRadius: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    borderRadius: 16,
  },
  loadingSpinner: {
    animation: 'spin 1s linear infinite',
  },
  iconContainer: {
    position: 'absolute',
    zIndex: 4,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
});

// Add keyframes for web spinner
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default Card;