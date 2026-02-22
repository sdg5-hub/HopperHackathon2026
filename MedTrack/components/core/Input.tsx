import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';

export function Input(props: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.colors.mutedText}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          minHeight: 44,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[2],
        },
        props.style,
      ]}
    />
  );
}
