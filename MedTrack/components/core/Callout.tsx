import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

type Tone = 'info' | 'warning' | 'danger';

const toneToIcon: Record<Tone, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle-outline',
  warning: 'warning-outline',
  danger: 'alert-circle-outline',
};

export function Callout({ tone, children }: PropsWithChildren<{ tone: Tone }>) {
  const theme = useTheme();
  const palette =
    tone === 'info'
      ? { bg: theme.colors.accentSoft, border: theme.colors.accent, text: theme.colors.text }
      : tone === 'warning'
      ? { bg: '#FEF3C7', border: theme.colors.warning, text: '#92400E' }
      : { bg: '#FEE2E2', border: theme.colors.danger, text: '#991B1B' };

  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: theme.spacing[3],
        flexDirection: 'row',
        gap: theme.spacing[2],
        alignItems: 'flex-start',
      }}
    >
      <Ionicons name={toneToIcon[tone]} size={theme.icon.md} color={palette.text} />
      <Text style={{ color: palette.text, flex: 1 }}>{children}</Text>
    </View>
  );
}
