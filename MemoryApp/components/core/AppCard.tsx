import { PropsWithChildren } from 'react';
import { View, type ViewStyle } from 'react-native';

type AppCardProps = PropsWithChildren<{ style?: ViewStyle }>;

export function AppCard({ children, style }: AppCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          padding: 14,
          gap: 8
        },
        style
      ]}
    >
      {children}
    </View>
  );
}
