import { Text, View } from 'react-native';
import { useTheme } from '@/theme';

export function Badge({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: theme.radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: theme.colors.accentSoft,
        borderWidth: 1,
        borderColor: theme.colors.accent,
      }}
    >
      <Text style={{ color: theme.colors.accent, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </View>
  );
}
