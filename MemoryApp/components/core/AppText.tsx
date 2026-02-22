import { PropsWithChildren } from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@/theme';

type Variant = 'title' | 'section' | 'body' | 'caption';

export function AppText({ children, style, ...props }: PropsWithChildren<TextProps & { variant?: Variant; muted?: boolean }>) {
  const { variant = 'body', muted = false } = props as { variant?: Variant; muted?: boolean };
  const theme = useTheme();
  const textProps = props as TextProps;

  return (
    <Text
      {...textProps}
      style={[
        theme.typography[variant],
        { color: muted ? theme.colors.mutedText : theme.colors.text },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
