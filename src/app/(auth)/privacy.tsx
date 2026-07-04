import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SECTIONS = [
  {
    title: '1. Datos que recopilamos',
    body: 'Recopilamos los datos que nos entregas al registrarte (nombres, apellidos, correo, teléfono), los movimientos financieros que registras, y datos técnicos del dispositivo para mantener la app segura y funcionando.',
  },
  {
    title: '2. Cómo usamos tus datos',
    body: 'Usamos tus datos para proveer el servicio, sincronizar tu información entre dispositivos, enviarte notificaciones importantes y mejorar KuchiCoin. No vendemos ni compartimos tus datos con terceros con fines comerciales.',
  },
  {
    title: '3. Almacenamiento y seguridad',
    body: 'Tus credenciales se almacenan cifradas mediante SecureStore del dispositivo. Los datos en tránsito viajan sobre HTTPS. Implementamos medidas técnicas y organizativas razonables para proteger tu información.',
  },
  {
    title: '4. Tus derechos',
    body: 'Puedes acceder, rectificar, eliminar o exportar tus datos personales en cualquier momento desde la sección de Configuración de la app. También puedes cerrar tu cuenta y solicitar la eliminación total de tus datos.',
  },
  {
    title: '5. Menores de edad',
    body: 'KuchiCoin está pensado para familias peruanas. Los menores de 14 años no deben crear cuentas propias; pueden participar como integrantes del hogar gestionado por un adulto responsable.',
  },
  {
    title: '6. Transferencias internacionales',
    body: 'Algunos proveedores de infraestructura pueden almacenar datos fuera del Perú. En esos casos nos aseguramos de que existan garantías equivalentes de protección de datos personales.',
  },
  {
    title: '7. Cambios a esta política',
    body: 'Te avisaremos cualquier cambio material por la app o por correo electrónico antes de que entre en vigencia.',
  },
];

export default function PrivacyScreen() {
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
          Política de Privacidad
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
