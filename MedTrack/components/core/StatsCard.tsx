import { Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { useTheme } from '@/theme';

type Props = {
  streakDays: number;
  sevenDayAdherencePct: number;
  trendHint: string;
};

export function StatsCard({ streakDays, sevenDayAdherencePct, trendHint }: Props) {
  const theme = useTheme();
  const progressPct = Math.max(0, Math.min(100, sevenDayAdherencePct));

  return (
    <AppCard>
      <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.text }}>Adherence Stats</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: theme.colors.mutedText }}>Streak</Text>
          <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800' }}>{streakDays} days</Text>
        </View>
        <View style={{ alignItems: 'flex-end', minWidth: 120 }}>
          <Text style={{ color: theme.colors.mutedText }}>7-day adherence</Text>
          <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800' }}>{sevenDayAdherencePct}%</Text>
        </View>
      </View>
      <View style={{ height: 10, borderRadius: 999, backgroundColor: theme.colors.accentSoft, overflow: 'hidden' }}>
        <View style={{ width: `${progressPct}%`, height: '100%', backgroundColor: theme.colors.accent }} />
      </View>
      <Text style={{ color: theme.colors.mutedText }}>{trendHint}</Text>
    </AppCard>
  );
}
