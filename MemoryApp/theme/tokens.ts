export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, lineHeight: 32, fontWeight: '700' as const, letterSpacing: 0.1 },
  section: { fontSize: 18, lineHeight: 22, fontWeight: '600' as const, letterSpacing: 0.1 },
  body: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, letterSpacing: 0.05 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const, letterSpacing: 0.05 },
} as const;

export const icon = {
  md: 20,
  lg: 24,
} as const;
