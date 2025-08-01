export interface ColorPalette {
  primary: {
    purple: string;
    purpleDark: string;
    purpleLight: string;
  };
  background: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  surface: {
    button: string;
    buttonPressed: string;
    card: string;
  };
  text: {
    primary: string;
    secondary: string;
    accent: string;
  };
  status: {
    connected: string;
    disconnected: string;
    warning: string;
  };
}

export interface Typography {
  fontFamily: {
    primary: string;
    secondary: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  fontWeight: {
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
}

export interface BorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  full: number;
}

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface Shadows {
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
}

export interface ButtonStyles {
  base: {
    borderRadius: number;
    paddingVertical: number;
    paddingHorizontal: number;
    alignItems: string;
    justifyContent: string;
  };
  variants: {
    primary: {
      backgroundColor: string;
      color: string;
    };
    secondary: {
      backgroundColor: string;
      color: string;
    };
    directional: {
      backgroundColor: string;
      color: string;
      minWidth: number;
      minHeight: number;
    };
  };
}

export interface DPadStyles {
  container: {
    width: number;
    height: number;
    position: string;
  };
  button: {
    backgroundColor: string;
    borderRadius: number;
    alignItems: string;
    justifyContent: string;
    position: string;
  };
  center: {
    width: number;
    height: number;
    borderRadius: number;
    top: number;
    left: number;
  };
  up: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
  down: {
    width: number;
    height: number;
    bottom: number;
    left: number;
  };
  left: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
  right: {
    width: number;
    height: number;
    top: number;
    right: number;
  };
}

export interface StatusBarStyles {
  container: {
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    paddingHorizontal: number;
    paddingVertical: number;
    backgroundColor: string;
  };
  deviceName: {
    fontSize: number;
    fontWeight: string;
    color: string;
  };
  connectionStatus: {
    width: number;
    height: number;
    borderRadius: number;
    backgroundColor: string;
  };
}

export interface BottomBarStyles {
  container: {
    backgroundColor: string;
    paddingVertical: number;
    paddingHorizontal: number;
    borderTopWidth: number;
    borderTopColor: string;
  };
  title: {
    fontSize: number;
    fontWeight: string;
    color: string;
    marginBottom: number;
  };
  subtitle: {
    fontSize: number;
    color: string;
  };
}

export interface ComponentStyles {
  button: ButtonStyles;
  dpad: DPadStyles;
  statusBar: StatusBarStyles;
  bottomBar: BottomBarStyles;
}

export interface LayoutStyles {
  container: {
    flex: number;
    backgroundColor: string;
    paddingHorizontal: number;
  };
  section: {
    marginVertical: number;
  };
  buttonGrid: {
    flexDirection: string;
    flexWrap: string;
    justifyContent: string;
    gap: number;
  };
  buttonRow: {
    flexDirection: string;
    justifyContent: string;
    marginVertical: number;
  };
}

export interface IconStyles {
  size: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  color: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface Theme {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  components: ComponentStyles;
  layout: LayoutStyles;
  icons: IconStyles;
}