import { ActivityIndicator, Pressable, Text, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type Tone = 'primary' | 'secondary' | 'danger';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: Tone;
  loading?: boolean;
  style?: ViewStyle;
};

export function AppButton({ label, onPress, disabled = false, tone = 'primary', loading = false, style }: AppButtonProps) {
  const theme = useTheme();
  const palette =
    tone === 'primary'
      ? { bg: theme.colors.accent, text: '#FFFFFF', border: theme.colors.accent }
      : tone === 'danger'
      ? { bg: theme.colors.danger, text: '#FFFFFF', border: theme.colors.danger }
      : { bg: theme.colors.surface, text: theme.colors.text, border: theme.colors.border };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 1,
          minHeight: 44,
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          borderRadius: theme.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: theme.spacing[2],
          opacity: disabled || loading ? 0.6 : pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }]
        },
        tone === 'primary' ? theme.shadow.floating : null,
        style
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={palette.text} /> : null}
      <Text style={{ color: palette.text, fontWeight: '700', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}
