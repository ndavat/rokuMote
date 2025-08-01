/**
 * Main App Entry Point
 * Connects RemoteScreen to ThemeProvider, AppStateProvider, and BLE services
 * Includes app lifecycle management and deep linking support
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { AppStateProvider } from '../src/state/AppStateContext';
import { ConnectedRemoteScreen } from '../src/screens/ConnectedRemoteScreen';
import { LoadingOverlay } from '../src/components/ui/LoadingOverlay';
import { MockModeBanner } from '../src/components/ui/MockModeBanner';
import { ErrorBoundary, BLEErrorBoundary, ErrorNotification } from '../src/components';
import { useAppSelector, selectors, useAppActions } from '../src/state';
import { AppStateManager } from '../src/services/AppStateManager';
import { getBLEServiceFactory } from '../src/services';
import { useErrorHandling } from '../src/hooks';

/**
 * App Content Component
 * Renders the main app content with loading and mock mode overlays
 * Manages app lifecycle and deep linking
 */
function AppContent() {
  const actions = useAppActions();
  const isLoading = useAppSelector(selectors.isLoading);
  const loadingMessage = useAppSelector(selectors.loadingMessage);
  const mockMode = useAppSelector(selectors.mockMode);
  const showMockBanner = useAppSelector(selectors.showMockBanner);
  const appStateManagerRef = useRef<AppStateManager | null>(null);
  
  // Error handling
  const [errorState, errorActions] = useErrorHandling({
    enableAutoRecovery: true,
    enableNotifications: true,
    onError: (error) => {
      console.error('App error:', error);
      // Update app state with error
      actions.connection.setConnectionError(error);
    },
    onRecovery: (error, success) => {
      if (success) {
        console.log('Error recovered:', error.errorId);
        actions.connection.clearConnectionError();
      }
    },
  });

  // Initialize app state manager
  useEffect(() => {
    const initializeAppStateManager = async () => {
      try {
        const bleServiceFactory = getBLEServiceFactory();
        const bleService = bleServiceFactory.createService(mockMode);
        
        const appStateManager = new AppStateManager({
          lifecycle: {
            maintainConnectionInBackground: true,
            reconnectOnForeground: true,
            backgroundTimeout: 30000,
          },
          deepLinking: {
            scheme: 'rokumote',
            enableCommandLinks: true,
            enableNavigationLinks: true,
          },
        });

        await appStateManager.initialize(bleService);
        appStateManagerRef.current = appStateManager;

        // Listen for app state events
        appStateManager.on('app_state_event', (event) => {
          console.log('App state event:', event);
          
          // Handle specific events
          switch (event.type) {
            case 'lifecycle_event':
              handleLifecycleEvent(event.data);
              break;
            case 'deep_link_event':
              handleDeepLinkEvent(event.data);
              break;
            case 'command_from_link':
              handleCommandFromLink(event.data);
              break;
            case 'navigation_from_link':
              handleNavigationFromLink(event.data);
              break;
            case 'connection_from_link':
              handleConnectionFromLink(event.data);
              break;
          }
        });

      } catch (error) {
        console.error('Failed to initialize app state manager:', error);
      }
    };

    initializeAppStateManager();

    // Cleanup on unmount
    return () => {
      if (appStateManagerRef.current) {
        appStateManagerRef.current.destroy();
        appStateManagerRef.current = null;
      }
    };
  }, [mockMode]);

  const handleLifecycleEvent = (event: any) => {
    switch (event.type) {
      case 'app_state_changed':
        console.log('App state changed to:', event.appState);
        break;
      case 'connection_maintained':
        console.log('Connection maintained in background');
        break;
      case 'connection_restored':
        console.log('Connection restored on foreground');
        actions.connection.setConnectionStatus('connected');
        break;
      case 'connection_suspended':
        console.log('Connection suspended');
        actions.connection.setConnectionStatus('disconnected');
        break;
    }
  };

  const handleDeepLinkEvent = (event: any) => {
    console.log('Deep link received:', event.url);
    // Handle deep link navigation through router
  };

  const handleCommandFromLink = (event: any) => {
    console.log('Command requested from deep link:', event.params);
    // Execute the command if connected
  };

  const handleNavigationFromLink = (event: any) => {
    console.log('Navigation requested from deep link:', event.params);
    // Navigate to the requested screen
  };

  const handleConnectionFromLink = (event: any) => {
    console.log('Connection requested from deep link:', event.params);
    // Attempt to connect to the specified device
  };

  const handleDismissMockBanner = () => {
    actions.ui.setMockBanner(false);
  };

  return (
    <ErrorBoundary 
      testID="app-error-boundary"
      onError={(error, errorInfo) => {
        console.error('App crashed:', error, errorInfo);
        // Log to crash reporting service in production
      }}
    >
      <BLEErrorBoundary 
        testID="ble-error-boundary"
        onError={(error) => {
          errorActions.handleError(error);
        }}
        onRecovery={() => {
          console.log('BLE error recovered');
        }}
      >
        <StatusBar style="light" backgroundColor="#1A1B2E" />
        
        {/* Mock Mode Banner */}
        <MockModeBanner 
          visible={mockMode && showMockBanner}
          onDismiss={handleDismissMockBanner}
          testID="mock-mode-banner" 
        />
        
        {/* Main Remote Screen */}
        <ConnectedRemoteScreen testID="main-remote-screen" />
        
        {/* Loading Overlay */}
        <LoadingOverlay 
          visible={isLoading}
          message={loadingMessage || 'Loading...'}
          testID="loading-overlay"
        />
        
        {/* Error Notification */}
        <ErrorNotification
          error={errorState.currentError}
          visible={errorState.showNotification}
          onDismiss={errorActions.dismissNotification}
          onRetry={errorActions.retryLastOperation}
          onRecover={() => errorActions.recoverFromError()}
          testID="error-notification"
        />
      </BLEErrorBoundary>
    </ErrorBoundary>
  );
}

/**
 * Main App Component
 * Sets up providers and renders the app
 */
export default function App() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </ThemeProvider>
  );
}