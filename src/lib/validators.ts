/**
 * Zod schemas for the auth forms. Schemas export both runtime validation
 * and inferred TS types for use with react-hook-form's `useForm<T>()`.
 */

import { z } from 'zod';

import { PERU_PHONE_REGEX, PASSWORD_RULES } from '@/constants/auth';

export const loginSchema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Mínimo 2 caracteres').max(60),
    lastName: z.string().min(2, 'Mínimo 2 caracteres').max(60),
    email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
    phone: z
      .string()
      .min(1, 'Ingresa tu celular')
      .regex(PERU_PHONE_REGEX, 'Ingresa un celular peruano válido (9 dígitos)'),
    password: z
      .string()
      .min(PASSWORD_RULES.minLength, `Mínimo ${PASSWORD_RULES.minLength} caracteres`)
      .regex(/[A-Z]/, 'Incluye una mayúscula')
      .regex(/[0-9]/, 'Incluye un número'),
    confirm: z.string().min(1, 'Confirma tu contraseña'),
    accept: z.literal(true, {
      error: 'Debes aceptar los términos y la política de privacidad',
    }),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    error: 'Las contraseñas no coinciden',
  });

export type RegisterForm = z.infer<typeof registerSchema>;

export const transactionSchema = z.object({
  amount: z
    .number({ error: 'Ingresa un monto' })
    .positive('El monto debe ser mayor a 0')
    .max(99_999_999, 'El monto es demasiado alto'),
  type: z.enum(['expense', 'income']),
  categoryId: z.string().nullable(),
  description: z.string().max(120, 'Máximo 120 caracteres').optional(),
});

export type TransactionForm = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(30, 'Máximo 30 caracteres'),
  type: z.enum(['expense', 'income']),
  icon: z.string().min(1, 'Selecciona un ícono'),
  color: z.string().min(1, 'Selecciona un color'),
});

export type CategoryForm = z.infer<typeof categorySchema>;
