import { PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type AppCardProps = PropsWithChildren<{ style?: ViewStyle }>;

export function AppCard({ children, style }: AppCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing[4],
          gap: theme.spacing[2],
          ...theme.shadow.card
        },
        style
      ]}
    >
      {children}
    </View>
  );
}
