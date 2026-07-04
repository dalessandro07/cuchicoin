import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceCard } from '@/components/home/choice-card';
import { ThemedView } from '@/components/themed-view';
import { BRAND } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useHome } from '@/hooks/use-home';
import { useTheme } from '@/hooks/use-theme';

export default function HomeChooserScreen() {
  const { signOut } = useAuth();
  const { status } = useHome();
  const theme = useTheme();

  if (status === 'in-home') {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Image source={BRAND.logoSource} style={styles.logo} contentFit="contain" />
            <Text style={[styles.heading, { color: theme.text }]}>¿Cómo quieres empezar?</Text>
            <Text style={[styles.slogan, { color: theme.textSecondary }]}>
              Crea un hogar nuevo o únete a uno con un código de invitación
            </Text>
          </View>

          <View style={styles.cards}>
            <ChoiceCard
              icon="add-circle-outline"
              title="Crear un hogar nuevo"
              description="Serás el administrador y podrás invitar a los demás miembros."
              onPress={() => router.push('/(app)/create-home')}
            />
            <ChoiceCard
              icon="people-outline"
              title="Unirme a un grupo"
              description="Ingresa el código de invitación que te compartió tu familia."
              onPress={() => router.push('/(app)/join-home')}
            />
          </View>

          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.signOut,
              { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Ionicons name="log-out-outline" size={18} color={theme.text} />
            <Text style={[styles.signOutText, { color: theme.text }]}>Cerrar sesión</Text>
          </Pressable>
        </ScrollView>
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.five,
  },
  intro: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 96,
    height: 96,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  slogan: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
  cards: {
    gap: Spacing.three,
  },
  signOut: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
