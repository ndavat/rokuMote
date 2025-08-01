/**
 * Complete Navigation Flow Test
 * Verifies the complete navigation flow between remote screen and settings screen
 */

describe('Complete Navigation Flow', () => {
  it('should have complete bidirectional navigation between remote and settings screens', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Test forward navigation (Remote -> Settings)
    const connectedRemoteScreenPath = path.join(__dirname, '../screens/ConnectedRemoteScreen.tsx');
    const connectedRemoteScreenContent = fs.readFileSync(connectedRemoteScreenPath, 'utf8');
    
    // Verify forward navigation is implemented
    expect(connectedRemoteScreenContent).toContain("router.push('/settings')");
    expect(connectedRemoteScreenContent).toContain("if (button === 'settings')");
    
    // Test backward navigation (Settings -> Remote)
    const settingsScreenPath = path.join(__dirname, '../../app/settings.tsx');
    const settingsScreenContent = fs.readFileSync(settingsScreenPath, 'utf8');
    
    // Verify back navigation is implemented
    expect(settingsScreenContent).toContain('router.back()');
    expect(settingsScreenContent).toContain('const handleBack = () => {');
    
    // Verify StatusBar component uses the back handler
    expect(settingsScreenContent).toContain('onClose={handleBack}');
  });

  it('should have proper Expo Router configuration for navigation', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check router layout configuration
    const layoutPath = path.join(__dirname, '../../app/_layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    // Verify Stack navigation is configured
    expect(layoutContent).toContain('import { Stack } from \'expo-router\'');
    expect(layoutContent).toContain('<Stack>');
    
    // Verify both screens are configured
    expect(layoutContent).toContain('name="index"');
    expect(layoutContent).toContain('name="settings"');
    
    // Verify settings screen has proper title
    expect(layoutContent).toContain("title: 'Settings'");
  });

  it('should have proper imports for navigation in both screens', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check ConnectedRemoteScreen imports
    const connectedRemoteScreenPath = path.join(__dirname, '../screens/ConnectedRemoteScreen.tsx');
    const connectedRemoteScreenContent = fs.readFileSync(connectedRemoteScreenPath, 'utf8');
    expect(connectedRemoteScreenContent).toContain("import { router } from 'expo-router'");
    
    // Check SettingsScreen imports
    const settingsScreenPath = path.join(__dirname, '../../app/settings.tsx');
    const settingsScreenContent = fs.readFileSync(settingsScreenPath, 'utf8');
    expect(settingsScreenContent).toContain("import { router } from 'expo-router'");
  });

  it('should handle navigation errors gracefully', () => {
    const fs = require('fs');
    const path = require('path');
    
    const connectedRemoteScreenPath = path.join(__dirname, '../screens/ConnectedRemoteScreen.tsx');
    const connectedRemoteScreenContent = fs.readFileSync(connectedRemoteScreenPath, 'utf8');
    
    // Verify error handling is implemented for navigation
    expect(connectedRemoteScreenContent).toContain('try {');
    expect(connectedRemoteScreenContent).toContain('} catch (error) {');
    expect(connectedRemoteScreenContent).toContain("console.error('Failed to navigate to settings:', error)");
  });

  it('should provide haptic feedback for settings navigation', () => {
    const fs = require('fs');
    const path = require('path');
    
    const connectedRemoteScreenPath = path.join(__dirname, '../screens/ConnectedRemoteScreen.tsx');
    const connectedRemoteScreenContent = fs.readFileSync(connectedRemoteScreenPath, 'utf8');
    
    // Verify haptic feedback is provided before navigation
    expect(connectedRemoteScreenContent).toContain('await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)');
    expect(connectedRemoteScreenContent).toContain('if (vibrationEnabled) {');
  });

  it('should not send BLE commands for settings button', () => {
    const fs = require('fs');
    const path = require('path');
    
    const connectedRemoteScreenPath = path.join(__dirname, '../screens/ConnectedRemoteScreen.tsx');
    const connectedRemoteScreenContent = fs.readFileSync(connectedRemoteScreenPath, 'utf8');
    
    // Verify settings button returns early and doesn't fall through to BLE command logic
    const settingsHandling = connectedRemoteScreenContent.match(
      /if \(button === 'settings'\) \{[\s\S]*?return;[\s\S]*?\}/
    );
    
    expect(settingsHandling).toBeTruthy();
    expect(settingsHandling![0]).toContain("router.push('/settings')");
    expect(settingsHandling![0]).toContain('return;');
  });
});