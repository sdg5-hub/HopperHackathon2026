import { Pressable, Text } from 'react-native';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: selected ? '#0F766E' : '#CBD5E1',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: selected ? '#CCFBF1' : '#FFFFFF'
      }}
    >
      <Text style={{ fontSize: 12, color: '#0F172A' }}>{label}</Text>
    </Pressable>
  );
}
