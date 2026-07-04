/**
 * KuchiCoin brand identity. Re-exports the palette from theme.ts for convenience
 * and centralises non-color brand attributes (name, slogan, logo asset).
 */

import { Colors } from '@/constants/theme';

export const BRAND = {
  name: 'KuchiCoin',
  slogan: 'La economía de tu hogar, en un solo lugar',
  logoSource: require('@/assets/images/logo.png'),
} as const;

export const BrandColors = Colors;
