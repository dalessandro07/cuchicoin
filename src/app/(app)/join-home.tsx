import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AuthFooter } from '@/components/auth/auth-footer';
import { PrimaryButton } from '@/components/auth/primary-button';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useHome } from '@/hooks/use-home';
import { useTheme } from '@/hooks/use-theme';

const joinHomeSchema = z.object({
  inviteCode: z
    .string()
    .min(6, 'El código tiene 6 caracteres')
    .max(6, 'El código tiene 6 caracteres')
    .regex(/^[A-Z0-9]{6}$/, 'Solo letras y números'),
});

type JoinHomeForm = z.infer<typeof joinHomeSchema>;

export default function JoinHomeScreen() {
  const { joinHome } = useHome();
  const theme = useTheme();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<JoinHomeForm>({
    resolver: zodResolver(joinHomeSchema),
    mode: 'onChange',
    defaultValues: { inviteCode: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await joinHome({ inviteCode: values.inviteCode });
      router.replace('/(app)/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo unir al hogar';
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
                <Ionicons name="people-outline" size={32} color={theme.accent} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Unirme a un grupo</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Pídele el código de invitación a quien administra el hogar. Tiene 6 caracteres
                (letras y números).
              </Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="inviteCode"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                      Código de invitación
                    </Text>
                    <View
                      style={[
                        styles.codeInputWrapper,
                        {
                          backgroundColor: theme.background,
                          borderColor: errors.inviteCode ? theme.danger : theme.border,
                        },
                      ]}>
                      <TextInput
                        style={[styles.codeInput, { color: theme.text }]}
                        value={value}
                        onChangeText={(text) => setValue('inviteCode', text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6), { shouldValidate: true })}
                        onBlur={onBlur}
                        placeholder="A3F9K2"
                        placeholderTextColor={theme.textSecondary}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        autoComplete="off"
                        maxLength={6}
                        keyboardType="default"
                        returnKeyType="go"
                        onSubmitEditing={isValid ? onSubmit : undefined}
                      />
                    </View>
                    {errors.inviteCode ? (
                      <Text style={[styles.error, { color: theme.danger }]}>
                        {errors.inviteCode.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />

              <PrimaryButton
                title="Unirme"
                onPress={onSubmit}
                loading={submitting}
                disabled={!isValid}
                style={styles.cta}
              />

              <AuthFooter
                prompt="¿No tienes código?"
                actionLabel="Crear hogar"
                onPress={() => router.replace('/(app)/create-home')}
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
  field: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  codeInputWrapper: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    width: '100%',
  },
  error: {
    fontSize: 12,
    marginLeft: Spacing.one,
    marginTop: Spacing.half,
  },
  cta: {
    marginTop: Spacing.two,
  },
});
