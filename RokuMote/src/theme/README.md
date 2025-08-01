# Theme System

This directory contains the complete theme system for RokuMote, providing a centralized way to manage colors, typography, spacing, and component styles.

## Structure

- `types.ts` - TypeScript interfaces for all theme types
- `theme.ts` - Main theme object with all design system values
- `ThemeProvider.tsx` - React Context provider for theme access
- `utils.ts` - Utility functions for accessing theme values
- `example.tsx` - Example component showing usage patterns
- `__tests__/` - Unit tests for the theme system

## Usage

### 1. Wrap your app with ThemeProvider

```tsx
import { ThemeProvider } from '@/theme';

export default function App() {
  return (
    <ThemeProvider>
      <YourAppContent />
    </ThemeProvider>
  );
}
```

### 2. Use the theme in components

#### Method 1: Direct theme access
```tsx
import { useTheme } from '@/theme';

const MyComponent = () => {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing.md,
    },
  });
  
  return <View style={styles.container} />;
};
```

#### Method 2: Utility functions
```tsx
import { getColor, getSpacing, getFontSize } from '@/theme';

const styles = StyleSheet.create({
  button: {
    backgroundColor: getColor('primary.purple'),
    padding: getSpacing('md'),
  },
  text: {
    fontSize: getFontSize('base'),
    color: getColor('text.primary'),
  },
});
```

#### Method 3: createStyles helper
```tsx
import { createStyles } from '@/theme';

const styles = createStyles((theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
  },
}));
```

## Available Theme Values

### Colors
- `colors.primary.*` - Purple accent colors
- `colors.background.*` - Background colors and gradients
- `colors.surface.*` - Surface colors for buttons and cards
- `colors.text.*` - Text colors
- `colors.status.*` - Status indicator colors

### Typography
- `typography.fontSize.*` - Font sizes (xs, sm, base, lg, xl, 2xl, 3xl)
- `typography.fontWeight.*` - Font weights (normal, medium, semibold, bold)
- `typography.fontFamily.*` - Font families

### Spacing
- `spacing.*` - Spacing values (xs, sm, md, lg, xl, 2xl, 3xl)

### Border Radius
- `borderRadius.*` - Border radius values (sm, md, lg, xl, 2xl, full)

### Shadows
- `shadows.*` - Shadow styles (sm, md, lg)

### Components
- `components.button.*` - Button component styles
- `components.dpad.*` - Directional pad styles
- `components.statusBar.*` - Status bar styles
- `components.bottomBar.*` - Bottom bar styles

### Layout
- `layout.*` - Common layout styles

### Icons
- `icons.size.*` - Icon sizes
- `icons.color.*` - Icon colors

## Utility Functions

- `getColor(path)` - Get color by dot notation path
- `getFontSize(size)` - Get font size by key
- `getFontWeight(weight)` - Get font weight by key
- `getSpacing(size)` - Get spacing by key
- `getBorderRadius(size)` - Get border radius by key
- `getShadow(size)` - Get shadow style by key
- `getButtonStyle(variant)` - Get complete button style
- `createStyles(factory)` - Create styles with theme access

## Testing

Run tests with:
```bash
npm test
```

The theme system includes comprehensive unit tests covering all utilities and theme values.