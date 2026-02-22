import { Text, View } from 'react-native';
import { AppButton } from './AppButton';

type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  onPressCta?: () => void;
};

export function EmptyState({ title, description, ctaLabel, onPressCta }: EmptyStateProps) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        gap: 8
      }}
    >
      <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: '#475569' }}>{description}</Text>
      {ctaLabel && onPressCta ? <AppButton label={ctaLabel} onPress={onPressCta} /> : null}
    </View>
  );
}
