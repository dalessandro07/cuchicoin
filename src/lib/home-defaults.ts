/**
 * Default categories seeded into every new home. Idempotent — only inserts
 * if no default categories exist for the home.
 */

import type { CategoryType } from '@/lib/db-types';

export type DefaultCategorySeed = {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
};

// Palette mirrors the brand: warm cream, dark brown primary, gold accent.
const COLORS = {
  brown: '#5C3A13',
  brownLight: '#8B6F4E',
  gold: '#E4A212',
  rust: '#B23A48',
  olive: '#7A8B3A',
  teal: '#3A8B7A',
  plum: '#6B3A8B',
  ink: '#3A4A5C',
  sand: '#A68B5C',
} as const;

export const DEFAULT_CATEGORIES: readonly DefaultCategorySeed[] = [
  { name: 'Comida', type: 'expense', icon: 'restaurant-outline', color: COLORS.rust },
  { name: 'Transporte', type: 'expense', icon: 'car-outline', color: COLORS.ink },
  { name: 'Vivienda', type: 'expense', icon: 'home-outline', color: COLORS.brown },
  { name: 'Servicios', type: 'expense', icon: 'flash-outline', color: COLORS.gold },
  { name: 'Salud', type: 'expense', icon: 'medkit-outline', color: COLORS.teal },
  { name: 'Educación', type: 'expense', icon: 'book-outline', color: COLORS.plum },
  { name: 'Entretenimiento', type: 'expense', icon: 'game-controller-outline', color: COLORS.olive },
  { name: 'Ropa', type: 'expense', icon: 'shirt-outline', color: COLORS.brownLight },
  { name: 'Otros gastos', type: 'expense', icon: 'ellipsis-horizontal-outline', color: COLORS.sand },
  { name: 'Salario', type: 'income', icon: 'cash-outline', color: COLORS.olive },
  { name: 'Freelance', type: 'income', icon: 'laptop-outline', color: COLORS.teal },
  { name: 'Ventas', type: 'income', icon: 'storefront-outline', color: COLORS.gold },
  { name: 'Regalos', type: 'income', icon: 'gift-outline', color: COLORS.rust },
  { name: 'Otros ingresos', type: 'income', icon: 'ellipsis-horizontal-outline', color: COLORS.sand },
];

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit I, O, 0, 1

export function generateInviteCode(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
