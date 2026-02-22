import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export type DoseDisplayStatus = 'taken' | 'missed' | 'skipped' | 'due' | 'snoozed';

const iconMap: Record<DoseDisplayStatus, keyof typeof Ionicons.glyphMap> = {
  taken: 'checkmark-circle-outline',
  missed: 'alert-circle-outline',
  skipped: 'play-skip-forward-outline',
  due: 'time-outline',
  snoozed: 'moon-outline'
};

export function StatusChip({ status }: { status: DoseDisplayStatus }) {
  const theme = useTheme();
  const tone =
    status === 'taken'
      ? { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' }
      : status === 'missed'
      ? { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' }
      : status === 'skipped'
      ? { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' }
      : status === 'snoozed'
      ? { bg: theme.colors.accentSoft, text: theme.colors.accent, border: theme.colors.accent }
      : { bg: '#DBEAFE', text: '#1E3A8A', border: '#93C5FD' };

  return (
    <View
      accessibilityLabel={`Status ${status}`}
      style={{
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: tone.border,
        backgroundColor: tone.bg,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
        minHeight: 28,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Ionicons name={iconMap[status]} size={14} color={tone.text} />
      <Text style={{ color: tone.text, fontWeight: '700', fontSize: 12 }}>{status.toUpperCase()}</Text>
    </View>
  );
}
