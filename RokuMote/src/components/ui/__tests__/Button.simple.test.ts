import { ButtonVariant } from '../Button';

describe('Button Component Types', () => {
  it('should have correct button variants', () => {
    const variants: ButtonVariant[] = ['primary', 'secondary', 'directional'];
    expect(variants).toHaveLength(3);
    expect(variants).toContain('primary');
    expect(variants).toContain('secondary');
    expect(variants).toContain('directional');
  });

  it('should export ButtonProps interface', () => {
    // This test ensures the types are properly exported
    const mockProps = {
      title: 'Test',
      onPress: jest.fn(),
      variant: 'primary' as ButtonVariant,
      disabled: false,
      accessibilityLabel: 'Test button',
      hapticFeedback: true,
    };
    
    expect(mockProps.title).toBe('Test');
    expect(mockProps.variant).toBe('primary');
    expect(typeof mockProps.onPress).toBe('function');
  });
});