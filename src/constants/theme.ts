/**
 * KuchiCoin design tokens. Light-only palette by design — dark mode is
 * intentionally not supported in this version of the app.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#5C3A13',
  background: '#FFF8F0',
  backgroundElement: '#F5EBDC',
  backgroundSelected: '#EADFC8',
  textSecondary: '#8B6F4E',
  primary: '#5C3A13',
  primaryContrast: '#FFF8F0',
  accent: '#E4A212',
  danger: '#B23A48',
  border: '#E6D6BD',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 480;
