import { Text, TextInput, type KeyboardTypeOptions } from 'react-native';
import { useTheme } from '@/theme';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType
}: FormFieldProps) {
  const theme = useTheme();

  return (
    <>
      <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedText}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 9,
          minHeight: multiline ? 90 : undefined,
          height: multiline ? undefined : 44,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface
        }}
      />
    </>
  );
}
