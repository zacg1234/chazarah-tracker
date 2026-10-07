// Design tokens shared with the web app (WebApp/src/styles.css :root)
export const colors = {
  bg: '#f4f6fa',
  card: '#ffffff',
  ink: '#0f172a',
  muted: '#64748b',
  line: '#e2e8f0',
  inputBorder: '#cbd5e1',
  placeholder: '#94a3b8',
  primary: '#2563eb',
  primarySoft: '#eff4ff',
  good: '#15803d',
  goodSoft: '#ecfdf3',
  bad: '#c62828',
  badSoft: '#fef2f2',
  gold: '#b39d0e',
  soft: '#f1f5f9',
  scrim: 'rgba(15,23,42,0.5)',
  // "entering for someone else" state
  warn: '#92400e',
  warnSoft: '#fef3c7',
  warnBar: '#fffbeb',
  warnLine: '#fde68a',
};

// ---- Refined scale (spacing, type, radii, soft shadow) ----
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radii = { sm: 10, md: 14, lg: 20, xl: 24, pill: 999 };

// One soft, layered shadow that renders the same on iOS and Android (replaces elevation's grey blur)
export const softShadow = {
  boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 6px 20px rgba(15,23,42,0.07)',
} as const;

// Inter, one family per weight (custom fonts ignore fontWeight on Android)
export const fontFamilies = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
} as const;

// Text field look shared by the auth screens
export const inputStyle = {
  width: '100%',
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: radii.md,
  paddingVertical: 15,
  paddingHorizontal: 16,
  marginVertical: 6,
  backgroundColor: colors.card,
  color: colors.ink,
  fontSize: 16,
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
} as const;
