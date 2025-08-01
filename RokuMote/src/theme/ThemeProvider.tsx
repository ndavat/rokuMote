import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Theme } from './types';
import { theme as baseTheme } from './theme';
import { useAccessibility } from '../hooks/useAccessibility';
import { scaleFontSize, scaleSpacing } from '../utils/accessibility';

interface ThemeContextType {
  theme: Theme;
  accessibility: {
    fontScale: number;
    isScreenReaderEnabled: boolean;
    isReduceMotionEnabled: boolean;
    getScaledFontSize: (size: number, maxScale?: number) => number;
    getScaledSpacing: (spacing: number, factor?: number) => number;
    getResponsiveButtonSize: (baseSize: number) => number;
    getAnimationDuration: (baseDuration: number) => number;
    shouldUseHapticFeedback: () => boolean;
    getResponsiveLayout: () => any;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const accessibility = useAccessibility();

  // Create accessibility-aware theme
  const accessibleTheme = useMemo(() => {
    const scaledTheme = { ...baseTheme };

    // Scale typography based on accessibility settings
    Object.keys(scaledTheme.typography.fontSize).forEach(key => {
      const originalSize = baseTheme.typography.fontSize[key as keyof typeof baseTheme.typography.fontSize];
      scaledTheme.typography.fontSize[key as keyof typeof scaledTheme.typography.fontSize] = 
        accessibility.getScaledFontSize(originalSize);
    });

    // Scale spacing based on accessibility settings
    Object.keys(scaledTheme.spacing).forEach(key => {
      const originalSpacing = baseTheme.spacing[key as keyof typeof baseTheme.spacing];
      scaledTheme.spacing[key as keyof typeof scaledTheme.spacing] = 
        accessibility.getScaledSpacing(originalSpacing);
    });

    // Scale component-specific font sizes
    scaledTheme.components.statusBar.deviceName.fontSize = 
      accessibility.getScaledFontSize(baseTheme.components.statusBar.deviceName.fontSize);
    
    scaledTheme.components.bottomBar.title.fontSize = 
      accessibility.getScaledFontSize(baseTheme.components.bottomBar.title.fontSize);
    
    scaledTheme.components.bottomBar.subtitle.fontSize = 
      accessibility.getScaledFontSize(baseTheme.components.bottomBar.subtitle.fontSize);

    // Scale icon sizes
    Object.keys(scaledTheme.icons.size).forEach(key => {
      const originalSize = baseTheme.icons.size[key as keyof typeof baseTheme.icons.size];
      scaledTheme.icons.size[key as keyof typeof scaledTheme.icons.size] = 
        Math.round(originalSize * Math.min(accessibility.fontScale, 1.3));
    });

    return scaledTheme;
  }, [accessibility.fontScale, accessibility.getScaledFontSize, accessibility.getScaledSpacing]);

  const contextValue = useMemo(() => ({
    theme: accessibleTheme,
    accessibility,
  }), [accessibleTheme, accessibility]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};