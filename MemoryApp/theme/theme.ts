import { useMemo } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { icon, radius, spacing, typography } from './tokens';

const lightColors = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  text: '#0D1321',
  mutedText: '#667085',
  accent: '#2F6FED',
  accentSoft: '#E8F0FF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E8ECF5',
  overlay: 'rgba(13,19,33,0.38)',
  gradientTop: '#EEF3FF',
  gradientBottom: '#F6F7FB',
};

const darkColors = {
  background: '#0B1220',
  surface: '#121B2E',
  text: '#EAF0FF',
  mutedText: '#AAB4D4',
  accent: '#6D5EF7',
  accentSoft: '#1A2240',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#1E2A46',
  overlay: 'rgba(3,8,20,0.65)',
  gradientTop: '#111A30',
  gradientBottom: '#0B1220',
};

export type AppTheme = {
  isDark: boolean;
  colors: typeof lightColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  icon: typeof icon;
  shadow: {
    card: ViewStyle;
    floating: ViewStyle;
  };
};

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return useMemo(() => {
    const cardShadow: ViewStyle = isDark
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 2,
        }
      : {
          shadowColor: '#0D1321',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
        };

    return {
      isDark,
      colors,
      spacing,
      radius,
      typography,
      icon,
      shadow: {
        card: cardShadow,
        floating: {
          ...cardShadow,
          elevation: 5,
        },
      },
    };
  }, [isDark, colors]);
}

export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

export function createThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (theme: AppTheme) => T
) {
  return () => {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
