/**
 * Enhanced Remote Screen
 * Combines RemoteScreen with loading states and mock mode banner
 */

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { RemoteScreen, RemoteScreenProps } from './RemoteScreen';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { MockModeBanner } from '../components/ui/MockModeBanner';
import { useAppSelector, selectors, useAppActions } from '../state';

export interface EnhancedRemoteScreenProps extends RemoteScreenProps {
  showLoadingOverlay?: boolean;
  loadingMessage?: string;
  showMockBanner?: boolean;
  onDismissMockBanner?: () => void;
}

export const EnhancedRemoteScreen: React.FC<EnhancedRemoteScreenProps> = ({
  showLoadingOverlay,
  loadingMessage,
  showMockBanner,
  onDismissMockBanner,
  testID = 'enhanced-remote-screen',
  ...remoteScreenProps
}) => {
  const actions = useAppActions();
  
  // Get loading and mock mode state from global state
  const isLoading = useAppSelector(selectors.isLoading);
  const globalLoadingMessage = useAppSelector(selectors.loadingMessage);
  const showGlobalMockBanner = useAppSelector(selectors.showMockBanner);

  // Determine final values (props override global state)
  const finalShowLoading = showLoadingOverlay ?? isLoading;
  const finalLoadingMessage = loadingMessage ?? globalLoadingMessage ?? 'Loading...';
  const finalShowMockBanner = showMockBanner ?? showGlobalMockBanner;

  const handleDismissMockBanner = () => {
    if (onDismissMockBanner) {
      onDismissMockBanner();
    } else {
      // Default behavior: hide the banner but keep mock mode active
      actions.ui.setMockBanner(false);
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      {/* Mock Mode Banner */}
      <MockModeBanner
        visible={finalShowMockBanner}
        onDismiss={handleDismissMockBanner}
        testID={`${testID}-mock-banner`}
      />

      {/* Main Remote Screen */}
      <RemoteScreen
        {...remoteScreenProps}
        testID={`${testID}-remote`}
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={finalShowLoading}
        message={finalLoadingMessage}
        testID={`${testID}-loading`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});