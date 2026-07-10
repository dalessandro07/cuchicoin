/**
 * Icon and color options offered when creating/editing a custom category.
 */

import type { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export const CATEGORY_ICONS: IconName[] = [
  'restaurant-outline',
  'car-outline',
  'home-outline',
  'flash-outline',
  'medkit-outline',
  'book-outline',
  'game-controller-outline',
  'shirt-outline',
  'cart-outline',
  'cafe-outline',
  'bus-outline',
  'airplane-outline',
  'paw-outline',
  'fitness-outline',
  'gift-outline',
  'cash-outline',
  'card-outline',
  'laptop-outline',
  'storefront-outline',
  'briefcase-outline',
  'school-outline',
  'wallet-outline',
  'trending-up-outline',
  'ellipsis-horizontal-outline',
];

export const CATEGORY_COLORS: string[] = [
  '#B23A48',
  '#E4A212',
  '#3A8B7A',
  '#7A8B3A',
  '#6B3A8B',
  '#3A4A5C',
  '#A68B5C',
  '#5C3A13',
  '#C2571E',
  '#2E7DA1',
  '#12A150',
  '#8B6F4E',
];
