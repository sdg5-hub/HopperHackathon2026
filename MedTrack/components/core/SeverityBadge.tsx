import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SeverityLevel } from '@/lib/app/constants';
import { SEVERITY_LABELS } from '@/lib/app/constants';
import { useTheme } from '@/theme';

const palette: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  emergency: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  urgent: { bg: '#FFEDD5', text: '#9A3412', border: '#FDBA74' },
  routine: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  info: { bg: '#E0F2FE', text: '#075985', border: '#7DD3FC' }
};

export function SeverityBadge({ level }: { level: SeverityLevel }) {
  const theme = useTheme();
  const color = palette[level];
  const icon =
    level === 'emergency'
      ? 'alert-circle-outline'
      : level === 'urgent'
      ? 'warning-outline'
      : level === 'routine'
      ? 'checkmark-circle-outline'
      : 'information-circle-outline';

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: color.border,
        backgroundColor: color.bg,
        borderRadius: theme.radius.pill,
        paddingVertical: 4,
        paddingHorizontal: 10,
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
      }}
    >
      <Ionicons name={icon} size={14} color={color.text} />
      <Text style={{ color: color.text, fontWeight: '700', fontSize: 12 }}>{SEVERITY_LABELS[level]}</Text>
    </View>
  );
}
