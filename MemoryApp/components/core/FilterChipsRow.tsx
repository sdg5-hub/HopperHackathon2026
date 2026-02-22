import { ScrollView, View } from 'react-native';
import { Chip } from './Chip';

export type FilterChipOption = {
  key: string;
  label: string;
};

type Props = {
  options: FilterChipOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
};

export function FilterChipsRow({ options, selectedKey, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
        {options.map((option) => (
          <Chip
            key={option.key}
            label={option.label}
            selected={selectedKey === option.key}
            onPress={() => onSelect(option.key)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
