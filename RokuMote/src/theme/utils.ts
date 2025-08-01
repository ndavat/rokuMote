import { Theme } from './types';
import { theme } from './theme';

// Color utilities
export const getColor = (colorPath: string): string => {
  const keys = colorPath.split('.');
  let value: any = theme.colors;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      throw new Error(`Color path "${colorPath}" not found in theme`);
    }
  }
  
  if (typeof value !== 'string') {
    throw new Error(`Color path "${colorPath}" does not resolve to a string value`);
  }
  
  return value;
};

// Typography utilities
export const getFontSize = (size: keyof Theme['typography']['fontSize']): number => {
  return theme.typography.fontSize[size];
};

export const getFontWeight = (weight: keyof Theme['typography']['fontWeight']) => {
  return theme.typography.fontWeight[weight];
};

export const getFontFamily = (family: keyof Theme['typography']['fontFamily']): string => {
  return theme.typography.fontFamily[family];
};

// Spacing utilities
export const getSpacing = (size: keyof Theme['spacing']): number => {
  return theme.spacing[size];
};

// Border radius utilities
export const getBorderRadius = (size: keyof Theme['borderRadius']): number => {
  return theme.borderRadius[size];
};

// Shadow utilities
export const getShadow = (size: keyof Theme['shadows']) => {
  return theme.shadows[size];
};

// Component style utilities
export const getButtonStyle = (variant: keyof Theme['components']['button']['variants']) => {
  return {
    ...theme.components.button.base,
    ...theme.components.button.variants[variant],
  };
};

export const getDPadStyle = (element: keyof Theme['components']['dpad']) => {
  return theme.components.dpad[element];
};

export const getStatusBarStyle = (element: keyof Theme['components']['statusBar']) => {
  return theme.components.statusBar[element];
};

export const getBottomBarStyle = (element: keyof Theme['components']['bottomBar']) => {
  return theme.components.bottomBar[element];
};

// Layout utilities
export const getLayoutStyle = (element: keyof Theme['layout']) => {
  return theme.layout[element];
};

// Icon utilities
export const getIconSize = (size: keyof Theme['icons']['size']): number => {
  return theme.icons.size[size];
};

export const getIconColor = (color: keyof Theme['icons']['color']): string => {
  return theme.icons.color[color];
};

// Utility to create styles with theme values
export const createStyles = <T extends Record<string, any>>(
  styleFactory: (theme: Theme) => T
): T => {
  return styleFactory(theme);
};

// Utility to get nested theme values safely
export const getThemeValue = (path: string): any => {
  const keys = path.split('.');
  let value: any = theme;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      throw new Error(`Theme path "${path}" not found`);
    }
  }
  
  return value;
};