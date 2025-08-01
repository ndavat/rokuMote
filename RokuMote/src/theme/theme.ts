import { Theme } from './types';
import designSystem from '../../../design-system.json';

export const theme: Theme = {
  colors: {
    primary: {
      purple: designSystem.colors.primary.purple,
      purpleDark: designSystem.colors.primary.purpleDark,
      purpleLight: designSystem.colors.primary.purpleLight,
    },
    background: {
      primary: designSystem.colors.background.primary,
      secondary: designSystem.colors.background.secondary,
      gradient: designSystem.colors.background.gradient,
    },
    surface: {
      button: designSystem.colors.surface.button,
      buttonPressed: designSystem.colors.surface.buttonPressed,
      card: designSystem.colors.surface.card,
    },
    text: {
      primary: designSystem.colors.text.primary,
      secondary: designSystem.colors.text.secondary,
      accent: designSystem.colors.text.accent,
    },
    status: {
      connected: designSystem.colors.status.connected,
      disconnected: designSystem.colors.status.disconnected,
      warning: designSystem.colors.status.warning,
    },
  },
  typography: {
    fontFamily: {
      primary: designSystem.typography.fontFamily.primary,
      secondary: designSystem.typography.fontFamily.secondary,
    },
    fontSize: {
      xs: designSystem.typography.fontSize.xs,
      sm: designSystem.typography.fontSize.sm,
      base: designSystem.typography.fontSize.base,
      lg: designSystem.typography.fontSize.lg,
      xl: designSystem.typography.fontSize.xl,
      '2xl': designSystem.typography.fontSize['2xl'],
      '3xl': designSystem.typography.fontSize['3xl'],
    },
    fontWeight: {
      normal: designSystem.typography.fontWeight.normal as '400',
      medium: designSystem.typography.fontWeight.medium as '500',
      semibold: designSystem.typography.fontWeight.semibold as '600',
      bold: designSystem.typography.fontWeight.bold as '700',
    },
  },
  spacing: {
    xs: designSystem.spacing.xs,
    sm: designSystem.spacing.sm,
    md: designSystem.spacing.md,
    lg: designSystem.spacing.lg,
    xl: designSystem.spacing.xl,
    '2xl': designSystem.spacing['2xl'],
    '3xl': designSystem.spacing['3xl'],
  },
  borderRadius: {
    sm: designSystem.borderRadius.sm,
    md: designSystem.borderRadius.md,
    lg: designSystem.borderRadius.lg,
    xl: designSystem.borderRadius.xl,
    '2xl': designSystem.borderRadius['2xl'],
    full: designSystem.borderRadius.full,
  },
  shadows: {
    sm: {
      shadowColor: designSystem.shadows.sm.shadowColor,
      shadowOffset: {
        width: designSystem.shadows.sm.shadowOffset.width,
        height: designSystem.shadows.sm.shadowOffset.height,
      },
      shadowOpacity: designSystem.shadows.sm.shadowOpacity,
      shadowRadius: designSystem.shadows.sm.shadowRadius,
      elevation: designSystem.shadows.sm.elevation,
    },
    md: {
      shadowColor: designSystem.shadows.md.shadowColor,
      shadowOffset: {
        width: designSystem.shadows.md.shadowOffset.width,
        height: designSystem.shadows.md.shadowOffset.height,
      },
      shadowOpacity: designSystem.shadows.md.shadowOpacity,
      shadowRadius: designSystem.shadows.md.shadowRadius,
      elevation: designSystem.shadows.md.elevation,
    },
    lg: {
      shadowColor: designSystem.shadows.lg.shadowColor,
      shadowOffset: {
        width: designSystem.shadows.lg.shadowOffset.width,
        height: designSystem.shadows.lg.shadowOffset.height,
      },
      shadowOpacity: designSystem.shadows.lg.shadowOpacity,
      shadowRadius: designSystem.shadows.lg.shadowRadius,
      elevation: designSystem.shadows.lg.elevation,
    },
  },
  components: {
    button: {
      base: {
        borderRadius: designSystem.components.button.base.borderRadius,
        paddingVertical: designSystem.components.button.base.paddingVertical,
        paddingHorizontal: designSystem.components.button.base.paddingHorizontal,
        alignItems: designSystem.components.button.base.alignItems,
        justifyContent: designSystem.components.button.base.justifyContent,
      },
      variants: {
        primary: {
          backgroundColor: designSystem.components.button.variants.primary.backgroundColor,
          color: designSystem.components.button.variants.primary.color,
        },
        secondary: {
          backgroundColor: designSystem.components.button.variants.secondary.backgroundColor,
          color: designSystem.components.button.variants.secondary.color,
        },
        directional: {
          backgroundColor: designSystem.components.button.variants.directional.backgroundColor,
          color: designSystem.components.button.variants.directional.color,
          minWidth: designSystem.components.button.variants.directional.minWidth,
          minHeight: designSystem.components.button.variants.directional.minHeight,
        },
      },
    },
    dpad: {
      container: {
        width: designSystem.components.dpad.container.width,
        height: designSystem.components.dpad.container.height,
        position: designSystem.components.dpad.container.position,
      },
      button: {
        backgroundColor: designSystem.components.dpad.button.backgroundColor,
        borderRadius: designSystem.components.dpad.button.borderRadius,
        alignItems: designSystem.components.dpad.button.alignItems,
        justifyContent: designSystem.components.dpad.button.justifyContent,
        position: designSystem.components.dpad.button.position,
      },
      center: {
        width: designSystem.components.dpad.center.width,
        height: designSystem.components.dpad.center.height,
        borderRadius: designSystem.components.dpad.center.borderRadius,
        top: designSystem.components.dpad.center.top,
        left: designSystem.components.dpad.center.left,
      },
      up: {
        width: designSystem.components.dpad.up.width,
        height: designSystem.components.dpad.up.height,
        top: designSystem.components.dpad.up.top,
        left: designSystem.components.dpad.up.left,
      },
      down: {
        width: designSystem.components.dpad.down.width,
        height: designSystem.components.dpad.down.height,
        bottom: designSystem.components.dpad.down.bottom,
        left: designSystem.components.dpad.down.left,
      },
      left: {
        width: designSystem.components.dpad.left.width,
        height: designSystem.components.dpad.left.height,
        top: designSystem.components.dpad.left.top,
        left: designSystem.components.dpad.left.left,
      },
      right: {
        width: designSystem.components.dpad.right.width,
        height: designSystem.components.dpad.right.height,
        top: designSystem.components.dpad.right.top,
        right: designSystem.components.dpad.right.right,
      },
    },
    statusBar: {
      container: {
        flexDirection: designSystem.components.statusBar.container.flexDirection,
        justifyContent: designSystem.components.statusBar.container.justifyContent,
        alignItems: designSystem.components.statusBar.container.alignItems,
        paddingHorizontal: designSystem.components.statusBar.container.paddingHorizontal,
        paddingVertical: designSystem.components.statusBar.container.paddingVertical,
        backgroundColor: designSystem.components.statusBar.container.backgroundColor,
      },
      deviceName: {
        fontSize: designSystem.components.statusBar.deviceName.fontSize,
        fontWeight: designSystem.components.statusBar.deviceName.fontWeight,
        color: designSystem.components.statusBar.deviceName.color,
      },
      connectionStatus: {
        width: designSystem.components.statusBar.connectionStatus.width,
        height: designSystem.components.statusBar.connectionStatus.height,
        borderRadius: designSystem.components.statusBar.connectionStatus.borderRadius,
        backgroundColor: designSystem.components.statusBar.connectionStatus.backgroundColor,
      },
    },
    bottomBar: {
      container: {
        backgroundColor: designSystem.components.bottomBar.container.backgroundColor,
        paddingVertical: designSystem.components.bottomBar.container.paddingVertical,
        paddingHorizontal: designSystem.components.bottomBar.container.paddingHorizontal,
        borderTopWidth: designSystem.components.bottomBar.container.borderTopWidth,
        borderTopColor: designSystem.components.bottomBar.container.borderTopColor,
      },
      title: {
        fontSize: designSystem.components.bottomBar.title.fontSize,
        fontWeight: designSystem.components.bottomBar.title.fontWeight,
        color: designSystem.components.bottomBar.title.color,
        marginBottom: designSystem.components.bottomBar.title.marginBottom,
      },
      subtitle: {
        fontSize: designSystem.components.bottomBar.subtitle.fontSize,
        color: designSystem.components.bottomBar.subtitle.color,
      },
    },
  },
  layout: {
    container: {
      flex: designSystem.layout.container.flex,
      backgroundColor: designSystem.layout.container.backgroundColor,
      paddingHorizontal: designSystem.layout.container.paddingHorizontal,
    },
    section: {
      marginVertical: designSystem.layout.section.marginVertical,
    },
    buttonGrid: {
      flexDirection: designSystem.layout.buttonGrid.flexDirection,
      flexWrap: designSystem.layout.buttonGrid.flexWrap,
      justifyContent: designSystem.layout.buttonGrid.justifyContent,
      gap: designSystem.layout.buttonGrid.gap,
    },
    buttonRow: {
      flexDirection: designSystem.layout.buttonRow.flexDirection,
      justifyContent: designSystem.layout.buttonRow.justifyContent,
      marginVertical: designSystem.layout.buttonRow.marginVertical,
    },
  },
  icons: {
    size: {
      sm: designSystem.icons.size.sm,
      md: designSystem.icons.size.md,
      lg: designSystem.icons.size.lg,
      xl: designSystem.icons.size.xl,
    },
    color: {
      primary: designSystem.icons.color.primary,
      secondary: designSystem.icons.color.secondary,
      accent: designSystem.icons.color.accent,
    },
  },
};