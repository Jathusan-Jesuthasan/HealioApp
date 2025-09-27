import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../utils/Colors';

const AppText = ({ children, variant = 'body', style }) => {
  return <Text style={[styles[variant], style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  body: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default AppText;
