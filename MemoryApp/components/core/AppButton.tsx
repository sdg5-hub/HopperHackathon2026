import { Pressable, Text, type ViewStyle } from 'react-native';

type Tone = 'primary' | 'secondary' | 'danger';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: Tone;
  style?: ViewStyle;
};

const toneStyles: Record<Tone, { bg: string; text: string; border: string }> = {
  primary: { bg: '#0F766E', text: '#FFFFFF', border: '#0F766E' },
  secondary: { bg: '#F8FAFC', text: '#0F172A', border: '#CBD5E1' },
  danger: { bg: '#DC2626', text: '#FFFFFF', border: '#DC2626' }
};

export function AppButton({ label, onPress, disabled = false, tone = 'primary', style }: AppButtonProps) {
  const palette = toneStyles[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 1,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: 'center',
          opacity: disabled ? 0.6 : 1
        },
        style
      ]}
    >
      <Text style={{ color: palette.text, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
