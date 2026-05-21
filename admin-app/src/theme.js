export const colors = {
  bg: '#0c0c0c',
  bgLight: '#1a1a1a',
  bgCard: '#151515',
  bgSurface: '#222',
  bgChip: '#1a1a1a',
  bgInput: '#1f1f1f',
  bgForm: '#111',
  yellow: '#f4ea26',
  yellowDark: '#b5ad10',
  yellowDim: 'rgba(244,234,38,0.15)',
  yellowGlow: 'rgba(244,234,38,0.3)',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#666',
  textDark: '#0c0c0c',
  border: '#2a2a2a',
  borderLight: '#333',
  green: '#4CAF50',
  greenDim: 'rgba(76,175,80,0.15)',
  orange: '#f39c12',
  orangeDim: 'rgba(243,156,18,0.15)',
  red: '#F44336',
  redDim: 'rgba(244,67,54,0.15)',
  blue: '#2196F3',
  blueDim: 'rgba(33,150,243,0.15)',
  overlay: 'rgba(0,0,0,0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  hero: { fontSize: 32, fontWeight: '900', letterSpacing: 0.5, color: colors.text },
  h1: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5, color: colors.text },
  h2: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  h3: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  body: { fontSize: 15, fontWeight: '600', color: colors.text },
  caption: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  small: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  button: { fontSize: 15, fontWeight: '900', letterSpacing: 1, color: colors.textDark },
};

export const shadows = {
  sm: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  md: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  lg: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  yellow: {
    elevation: 6,
    shadowColor: colors.yellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
};

export const gradients = {
  bg: [colors.bgLight, colors.bg],
  bgDeep: [colors.bgLight, '#050505'],
  card: [colors.bgCard, colors.bg],
  yellowBtn: [colors.yellow, colors.yellowDark],
  redBtn: [colors.red, '#C62828'],
  greenBtn: [colors.green, '#2E7D32'],
};
