import { Modal, Text, View } from 'react-native';
import type { DoseEvent } from '@/lib/notifications/types';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { useTheme } from '@/theme';

type DueDoseModalProps = {
  visible: boolean;
  doseEvent: DoseEvent | null;
  medicationName?: string;
  dosage?: string;
  instructions?: string;
  warningTags?: string[];
  onTaken: () => void;
  onSkip: () => void;
  onSnooze: (minutes: 10 | 30 | 60) => void;
  onClose: () => void;
};

export function DueDoseModal({
  visible,
  doseEvent,
  medicationName,
  dosage,
  instructions,
  warningTags,
  onTaken,
  onSkip,
  onSnooze,
  onClose
}: DueDoseModalProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay }}>
        <AppCard style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, gap: 10, paddingBottom: 26 }}>
          <Text style={{ fontSize: 19, fontWeight: '700', color: theme.colors.text }}>Dose Due Now</Text>
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
            {medicationName ?? 'Medication'}{dosage ? ` • ${dosage}` : ''}
          </Text>
          {instructions ? <Text style={{ color: theme.colors.mutedText }}>{instructions}</Text> : null}
          {warningTags?.length ? <Text style={{ color: '#B45309' }}>Warnings: {warningTags.join(', ')}</Text> : null}
          {doseEvent ? (
            <Text style={{ color: theme.colors.mutedText, fontSize: 12 }}>Scheduled: {new Date(doseEvent.scheduled_for).toLocaleString()}</Text>
          ) : null}

          <AppButton label="Taken" onPress={onTaken} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <AppButton label="Snooze 10" tone="secondary" onPress={() => onSnooze(10)} style={{ flex: 1 }} />
            <AppButton label="Snooze 30" tone="secondary" onPress={() => onSnooze(30)} style={{ flex: 1 }} />
            <AppButton label="Snooze 60" tone="secondary" onPress={() => onSnooze(60)} style={{ flex: 1 }} />
          </View>
          <AppButton label="Skip" tone="danger" onPress={onSkip} />
          <AppButton label="Close" tone="secondary" onPress={onClose} />
        </AppCard>
      </View>
    </Modal>
  );
}
