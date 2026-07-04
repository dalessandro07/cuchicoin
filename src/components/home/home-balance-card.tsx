import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type HomeBalanceCardProps = {
  memberCount: number;
};

export function HomeBalanceCard({ memberCount }: HomeBalanceCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={18} color={theme.accent} />
        <Text style={[styles.title, { color: theme.text }]}>Balance del hogar</Text>
      </View>
      <Text style={[styles.amount, { color: theme.text }]}>S/ 0.00</Text>
      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        Pronto podrás registrar ingresos y gastos. Mientras tanto, invita a tu familia con el código
        de arriba.
      </Text>
      <View style={[styles.meta, { borderTopColor: theme.border }]}>
        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
          {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
  },
  meta: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  metaText: {
    fontSize: 12,
  },
});
