import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';
import { createStyles, getColor, getFontSize, getSpacing } from './utils';

// Example component showing how to use the theme system
export const ThemeExample: React.FC = () => {
  const { theme } = useTheme();

  // Method 1: Using the theme object directly
  const directStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
    },
    title: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
    },
  });

  // Method 2: Using utility functions
  const utilityStyles = StyleSheet.create({
    button: {
      backgroundColor: getColor('primary.purple'),
      padding: getSpacing('md'),
      borderRadius: 12,
    },
    buttonText: {
      color: getColor('text.primary'),
      fontSize: getFontSize('base'),
    },
  });

  // Method 3: Using createStyles helper
  const helperStyles = createStyles((theme) => StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface.card,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.xl,
      ...theme.shadows.md,
    },
    cardText: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.fontSize.sm,
    },
  }));

  return (
    <View style={directStyles.container}>
      <Text style={directStyles.title}>Theme System Example</Text>
      
      <View style={utilityStyles.button}>
        <Text style={utilityStyles.buttonText}>Button with Utilities</Text>
      </View>
      
      <View style={helperStyles.card}>
        <Text style={helperStyles.cardText}>Card with Helper Function</Text>
      </View>
    </View>
  );
};