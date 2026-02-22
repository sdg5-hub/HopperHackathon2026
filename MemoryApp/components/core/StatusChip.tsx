import { Text, View } from 'react-native';

export type DoseDisplayStatus = 'taken' | 'missed' | 'skipped' | 'due' | 'snoozed';

const styleMap: Record<DoseDisplayStatus, { bg: string; text: string; border: string }> = {
  taken: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  missed: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  skipped: { bg: '#FFEDD5', text: '#9A3412', border: '#FDBA74' },
  due: { bg: '#E0F2FE', text: '#075985', border: '#7DD3FC' },
  snoozed: { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' }
};

export function StatusChip({ status }: { status: DoseDisplayStatus }) {
  const tone = styleMap[status];
  return (
    <View
      accessibilityLabel={`Status ${status}`}
      style={{
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: tone.border,
        backgroundColor: tone.bg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4
      }}
    >
      <Text style={{ color: tone.text, fontWeight: '700', fontSize: 12 }}>{status.toUpperCase()}</Text>
    </View>
  );
}
