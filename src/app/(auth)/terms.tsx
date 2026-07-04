import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SECTIONS = [
  {
    title: '1. Aceptación de los términos',
    body: 'Al crear una cuenta en KuchiCoin aceptas estos Términos y Condiciones. Si no estás de acuerdo con alguno de los puntos, no utilices la aplicación.',
  },
  {
    title: '2. Descripción del servicio',
    body: 'KuchiCoin es una aplicación móvil para la gestión de las finanzas del hogar peruano. Permite registrar ingresos, gastos, presupuestos y metas familiares.',
  },
  {
    title: '3. Registro y cuenta',
    body: 'Para usar KuchiCoin debes registrarte con un correo válido y una contraseña segura. Eres responsable de mantener la confidencialidad de tus credenciales.',
  },
  {
    title: '4. Uso aceptable',
    body: 'No puedes usar KuchiCoin para actividades ilícitas, fraudulentas o que vulneren derechos de terceros. Nos reservamos el derecho de suspender cuentas que violen estas normas.',
  },
  {
    title: '5. Privacidad',
    body: 'El tratamiento de tus datos personales se rige por nuestra Política de Privacidad, que forma parte integrante de estos términos.',
  },
  {
    title: '6. Modificaciones',
    body: 'Podemos actualizar estos términos para reflejar mejoras del servicio o cambios legales. Te avisaremos por la app o por correo electrónico.',
  },
  {
    title: '7. Contacto',
    body: '¿Dudas o sugerencias? Escríbenos a soporte@kuchicoin.app.',
  },
];

export default function TermsScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          style={styles.close}>
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.title}>
          Términos y Condiciones
        </ThemedText>
        <View style={styles.close} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{section.body}</Text>
          </View>
        ))}
        <Text style={[styles.updated, { color: theme.textSecondary }]}>
          Última actualización: enero 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  close: {
    width: 40,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.one,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
  updated: {
    fontSize: 12,
    marginTop: Spacing.four,
    textAlign: 'center',
  },
});
