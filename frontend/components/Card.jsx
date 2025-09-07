import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Colors } from "../utils/Colors";

const Card = ({
  children,
  style,
  onPress,
  elevation = 3,
  borderRadius = 12,
  padding = 16,
}) => {
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[
        styles.card,
        {
          elevation,
          borderRadius,
          padding,
        },
        Platform.OS === "ios"
          ? {
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: elevation * 2,
              shadowOffset: { width: 0, height: elevation },
            }
          : {},
        style, // allow custom styles
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {children}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    marginBottom: 16,
  },
});

export default Card;
