import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface BottomPanelProps {
  title: string;
  subtitle: string;
  testID?: string;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({ title, subtitle, testID }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.components.bottomBar.container.backgroundColor,
      paddingVertical: theme.components.bottomBar.container.paddingVertical,
      paddingHorizontal: theme.components.bottomBar.container.paddingHorizontal,
      borderTopWidth: theme.components.bottomBar.container.borderTopWidth,
      borderTopColor: theme.components.bottomBar.container.borderTopColor,
    }]} testID={testID}>
      <Text 
        style={[styles.title, {
          fontSize: theme.components.bottomBar.title.fontSize,
          fontWeight: theme.components.bottomBar.title.fontWeight as any,
          color: theme.components.bottomBar.title.color,
          marginBottom: theme.components.bottomBar.title.marginBottom,
        }]}
        testID={testID ? `${testID}-title` : undefined}
      >
        {title}
      </Text>
      <Text 
        style={[styles.subtitle, {
          fontSize: theme.components.bottomBar.subtitle.fontSize,
          color: theme.components.bottomBar.subtitle.color,
        }]}
        testID={testID ? `${testID}-subtitle` : undefined}
      >
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {},
  subtitle: {},
});