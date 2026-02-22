import { Pressable, Text } from 'react-native';
import { useTheme } from '@/theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Chip({ label, selected = false, onPress, accessibilityLabel }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        minHeight: 36,
        justifyContent: 'center',
        backgroundColor: selected ? theme.colors.accentSoft : theme.colors.surface,
        opacity: pressed ? 0.88 : 1
      })}
    >
      <Text style={{ fontSize: 12, color: selected ? theme.colors.accent : theme.colors.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
