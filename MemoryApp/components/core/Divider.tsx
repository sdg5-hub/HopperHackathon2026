import { View } from 'react-native';
import { useTheme } from '@/theme';

export function Divider() {
  const theme = useTheme();
  return <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing[2] }} />;
}
