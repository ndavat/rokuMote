import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export interface ResponsiveContainerProps extends ViewProps {
  children: React.ReactNode;
  maxWidth?: number;
  centerContent?: boolean;
  adaptPadding?: boolean;
}

/**
 * Responsive container that adapts to different screen sizes and accessibility settings
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth,
  centerContent = false,
  adaptPadding = true,
  style,
  ...props
}) => {
  const { accessibility } = useTheme();
  const layout = accessibility.getResponsiveLayout();

  const containerStyle = [
    styles.container,
    {
      paddingHorizontal: adaptPadding ? layout.containerPadding : 0,
      maxWidth: maxWidth || layout.maxContentWidth,
      alignSelf: centerContent ? ('center' as const) : ('stretch' as const),
    },
    style,
  ];

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});