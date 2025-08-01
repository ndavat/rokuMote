import { theme } from '../theme';
import { 
  getColor, 
  getFontSize, 
  getSpacing, 
  getBorderRadius, 
  getButtonStyle,
  createStyles 
} from '../utils';

describe('Theme System', () => {
  test('theme object is properly structured', () => {
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.spacing).toBeDefined();
    expect(theme.borderRadius).toBeDefined();
    expect(theme.shadows).toBeDefined();
    expect(theme.components).toBeDefined();
    expect(theme.layout).toBeDefined();
    expect(theme.icons).toBeDefined();
  });

  test('getColor utility works correctly', () => {
    expect(getColor('primary.purple')).toBe('#8B5CF6');
    expect(getColor('background.primary')).toBe('#1A1B2E');
    expect(getColor('text.primary')).toBe('#FFFFFF');
  });

  test('getFontSize utility works correctly', () => {
    expect(getFontSize('base')).toBe(16);
    expect(getFontSize('lg')).toBe(18);
    expect(getFontSize('2xl')).toBe(24);
  });

  test('getSpacing utility works correctly', () => {
    expect(getSpacing('sm')).toBe(8);
    expect(getSpacing('md')).toBe(16);
    expect(getSpacing('lg')).toBe(24);
  });

  test('getBorderRadius utility works correctly', () => {
    expect(getBorderRadius('sm')).toBe(4);
    expect(getBorderRadius('md')).toBe(8);
    expect(getBorderRadius('lg')).toBe(12);
  });

  test('getButtonStyle utility works correctly', () => {
    const primaryButton = getButtonStyle('primary');
    expect(primaryButton.backgroundColor).toBe('#8B5CF6');
    expect(primaryButton.color).toBe('#FFFFFF');
    expect(primaryButton.borderRadius).toBe(12);
    expect(primaryButton.paddingVertical).toBe(16);
  });

  test('createStyles utility works correctly', () => {
    const styles = createStyles((theme) => ({
      container: {
        backgroundColor: theme.colors.background.primary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
      },
      text: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.fontSize.base,
      },
    }));

    expect(styles.container.backgroundColor).toBe('#1A1B2E');
    expect(styles.container.padding).toBe(16);
    expect(styles.container.borderRadius).toBe(12);
    expect(styles.text.color).toBe('#FFFFFF');
    expect(styles.text.fontSize).toBe(16);
  });

  test('theme values match design system', () => {
    // Test key color values
    expect(theme.colors.primary.purple).toBe('#8B5CF6');
    expect(theme.colors.background.primary).toBe('#1A1B2E');
    expect(theme.colors.surface.button).toBe('#2D3748');
    
    // Test typography values
    expect(theme.typography.fontSize.base).toBe(16);
    expect(theme.typography.fontWeight.bold).toBe('700');
    
    // Test spacing values
    expect(theme.spacing.md).toBe(16);
    expect(theme.spacing.lg).toBe(24);
    
    // Test component styles
    expect(theme.components.button.base.borderRadius).toBe(12);
    expect(theme.components.dpad.container.width).toBe(200);
  });
});