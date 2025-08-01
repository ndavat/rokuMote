import React from 'react';
import { render } from '@testing-library/react-native';
import { RemoteScreen } from '../RemoteScreen';
import { ThemeProvider } from '../../theme/ThemeProvider';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Helper function to render component with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('RemoteScreen', () => {
  it('renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <RemoteScreen testID="remote-screen" />
    );

    expect(getByTestId('remote-screen')).toBeTruthy();
  });

});