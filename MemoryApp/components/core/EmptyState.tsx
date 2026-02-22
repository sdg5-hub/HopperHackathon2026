import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from './AppButton';
import { useTheme } from '@/theme';

type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  onPressCta?: () => void;
};

export function EmptyState({ title, description, ctaLabel, onPressCta }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        gap: 8
      }}
    >
      <Ionicons name="sparkles-outline" size={24} color={theme.colors.accent} />
      <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: theme.colors.mutedText }}>{description}</Text>
      {ctaLabel && onPressCta ? <AppButton label={ctaLabel} onPress={onPressCta} /> : null}
    </View>
  );
}
