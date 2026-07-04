import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AuthFooter } from '@/components/auth/auth-footer';
import { AuthInput } from '@/components/auth/auth-input';
import { PrimaryButton } from '@/components/auth/primary-button';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useHome } from '@/hooks/use-home';
import { useTheme } from '@/hooks/use-theme';

const createHomeSchema = z.object({
  name: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(/^[\p{L}\p{N}\s'.-]+$/u, 'Solo letras, números y espacios'),
});

type CreateHomeForm = z.infer<typeof createHomeSchema>;

export default function CreateHomeScreen() {
  const { createHome } = useHome();
  const theme = useTheme();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateHomeForm>({
    resolver: zodResolver(createHomeSchema),
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await createHome({ name: values.name });
      router.replace('/(app)/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el hogar';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Volver"
              style={styles.back}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </Pressable>

            <View style={styles.headerBlock}>
              <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name="add-circle-outline" size={32} color={theme.accent} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Crear un hogar nuevo</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Serás el administrador del hogar y podrás invitar a tu familia con un código.
              </Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange, onBlur } }) => (
                  <AuthInput
                    label="Nombre del hogar"
                    icon="home-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    placeholder="Familia Pérez"
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                  />
                )}
              />

              <View style={[styles.currencyHint, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Ionicons name="cash-outline" size={18} color={theme.textSecondary} />
                <Text style={[styles.currencyText, { color: theme.textSecondary }]}>
                  Moneda del hogar:{' '}
                  <Text style={{ color: theme.text, fontWeight: '700' }}>Soles (S/)</Text>
                </Text>
              </View>

              <PrimaryButton
                title="Crear hogar"
                onPress={onSubmit}
                loading={submitting}
                disabled={!isValid}
                style={styles.cta}
              />

              <AuthFooter
                prompt="¿Ya tienes un código?"
                actionLabel="Unirme"
                onPress={() => router.replace('/(app)/join-home')}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safe: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    marginLeft: -Spacing.two,
  },
  headerBlock: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  form: {
    gap: Spacing.three,
  },
  currencyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  currencyText: {
    fontSize: 13,
  },
  cta: {
    marginTop: Spacing.two,
  },
});
