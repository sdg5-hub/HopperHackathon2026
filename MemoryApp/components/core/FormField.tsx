import { Text, TextInput, type KeyboardTypeOptions } from 'react-native';

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
  return (
    <>
      <Text style={{ color: '#334155', fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1,
          borderColor: '#CBD5E1',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 9,
          minHeight: multiline ? 90 : undefined,
          backgroundColor: '#FFFFFF'
        }}
      />
    </>
  );
}
