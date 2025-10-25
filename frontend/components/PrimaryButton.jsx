import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Colors } from "../utils/Colors";

const PrimaryButton = ({ title, onPress, style, textStyle }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default PrimaryButton;
