import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import {
  StatusBar,
  DirectionalPad,
  QuickAccessButtons,
  MediaControls,
  VolumeControls,
  BottomPanel,
} from '../components/ui';
import type { DirectionType } from '../components/ui/DirectionalPad';
import type { QuickAccessButtonType } from '../components/ui/QuickAccessButtons';
import type { MediaControlButtonType } from '../components/ui/MediaControls';
import type { VolumeControlButtonType } from '../components/ui/VolumeControls';

export interface RemoteScreenProps {
  deviceName?: string;
  isConnected?: boolean;
  onClose?: () => void;
  onPowerToggle?: () => void;
  onDirectionPress?: (direction: DirectionType) => void;
  onOkPress?: () => void;
  onQuickAccessPress?: (button: QuickAccessButtonType) => void;
  onMediaPress?: (action: MediaControlButtonType) => void;
  onVolumePress?: (action: VolumeControlButtonType) => void;
  disabled?: boolean;
  isPlaying?: boolean;
  isMuted?: boolean;
  testID?: string;
}

export const RemoteScreen: React.FC<RemoteScreenProps> = ({
  deviceName = 'Bedroom',
  isConnected = false,
  onClose = () => {},
  onPowerToggle = () => {},
  onDirectionPress = () => {},
  onOkPress = () => {},
  onQuickAccessPress = () => {},
  onMediaPress = () => {},
  onVolumePress = () => {},
  disabled = false,
  isPlaying = false,
  isMuted = false,
  testID = 'remote-screen',
}) => {
  const { theme } = useTheme();

  // Create gradient colors from theme
  const gradientColors = [
    theme.colors.background.primary,
    theme.colors.background.secondary,
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <RNStatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      <LinearGradient
        colors={gradientColors}
        style={styles.container}
        testID={`${testID}-gradient`}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: theme.layout.container.paddingHorizontal }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          testID={`${testID}-scroll`}
        >
          {/* Status Bar */}
          <View style={[styles.section, { marginVertical: theme.layout.section.marginVertical }]}>
            <StatusBar
              deviceName={deviceName}
              isConnected={isConnected}
              onClose={onClose}
              onPowerToggle={onPowerToggle}
              testID={`${testID}-status-bar`}
            />
          </View>

          {/* Quick Access Buttons - Top Row */}
          <View style={[styles.section, { marginVertical: theme.layout.section.marginVertical }]}>
            <QuickAccessButtons
              onButtonPress={onQuickAccessPress}
              disabled={disabled}
              testID={`${testID}-quick-access`}
            />
          </View>

          {/* Directional Pad */}
          <View style={[styles.section, styles.dpadSection, { marginVertical: theme.layout.section.marginVertical }]}>
            <DirectionalPad
              onDirectionPress={onDirectionPress}
              onOkPress={onOkPress}
              disabled={disabled}
              testID={`${testID}-dpad`}
            />
          </View>

          {/* Media Controls */}
          <View style={[styles.section, { marginVertical: theme.layout.section.marginVertical }]}>
            <MediaControls
              onMediaPress={onMediaPress}
              disabled={disabled}
              isPlaying={isPlaying}
              testID={`${testID}-media-controls`}
            />
          </View>

          {/* Volume Controls */}
          <View style={[styles.section, { marginVertical: theme.layout.section.marginVertical }]}>
            <VolumeControls
              onVolumePress={onVolumePress}
              disabled={disabled}
              isMuted={isMuted}
              testID={`${testID}-volume-controls`}
            />
          </View>
        </ScrollView>

        {/* Bottom Panel */}
        <BottomPanel
          title="My Roku"
          subtitle="Remote Control"
          testID={`${testID}-bottom-panel`}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1B2E', // Fallback color
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 20,
  },
  section: {
    alignItems: 'center',
  },
  dpadSection: {
    paddingVertical: 20,
  },
});