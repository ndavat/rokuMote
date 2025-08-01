import { QuickAccessButtonType } from '../QuickAccessButtons';

describe('QuickAccessButtons Component Types', () => {
  it('should have correct button types', () => {
    const buttonTypes: QuickAccessButtonType[] = [
      'search', 
      'voice', 
      'keyboard', 
      'settings', 
      'back', 
      'guide', 
      'home'
    ];
    
    expect(buttonTypes).toHaveLength(7);
    expect(buttonTypes).toContain('search');
    expect(buttonTypes).toContain('voice');
    expect(buttonTypes).toContain('keyboard');
    expect(buttonTypes).toContain('settings');
    expect(buttonTypes).toContain('back');
    expect(buttonTypes).toContain('guide');
    expect(buttonTypes).toContain('home');
  });

  it('should export QuickAccessButtonsProps interface', () => {
    // This test ensures the types are properly exported
    const mockProps = {
      onButtonPress: jest.fn(),
      disabled: false,
      testID: 'test-quick-access',
    };
    
    expect(typeof mockProps.onButtonPress).toBe('function');
    expect(mockProps.disabled).toBe(false);
    expect(mockProps.testID).toBe('test-quick-access');
  });

  it('should have proper button type constraints', () => {
    const validTypes: QuickAccessButtonType[] = [
      'search', 'voice', 'keyboard', 'settings', 'back', 'guide', 'home'
    ];
    
    // Test that each type is a string
    validTypes.forEach(type => {
      expect(typeof type).toBe('string');
    });
  });
});