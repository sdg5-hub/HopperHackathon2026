export type SeverityLevel = 'emergency' | 'urgent' | 'routine' | 'info';

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  emergency: 'Emergency',
  urgent: 'Urgent',
  routine: 'Routine',
  info: 'Info'
};

export const DISCLAIMERS = {
  NOT_MEDICAL_ADVICE: 'Not medical advice.',
  NOT_EXHAUSTIVE: 'Guidance is not exhaustive and does not replace professional medical advice.'
} as const;

export type AutoMissWindow = '1h' | '2h' | '4h' | 'never';

export const AUTO_MISS_WINDOW_MS: Record<Exclude<AutoMissWindow, 'never'>, number> = {
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000
};
