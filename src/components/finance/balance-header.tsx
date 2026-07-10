import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useMoneyVisibility } from '@/hooks/use-money-visibility';
import { formatSoles } from '@/lib/money';
import type { Balance } from '@/lib/db-types';

export type BalanceHeaderProps = {
  homeName: string;
  balance: Balance;
};

export function BalanceHeader({ homeName, balance }: BalanceHeaderProps) {
  const theme = useTheme();
  const { hidden, toggle } = useMoneyVisibility();

  const mask = (cents: number) => (hidden ? '••••••' : formatSoles(cents));

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: theme.primaryContrast }]}>Saldo de {homeName}</Text>
        <Pressable
          onPress={toggle}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Mostrar saldo' : 'Ocultar saldo'}
          style={({ pressed }) => [styles.eye, { opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={theme.primaryContrast}
          />
        </Pressable>
      </View>

      <Text style={[styles.amount, { color: theme.primaryContrast }]}>{mask(balance.balanceCents)}</Text>

      <View style={styles.breakdown}>
        <View style={styles.pill}>
          <Ionicons name="arrow-down-circle" size={16} color={theme.success} />
          <View>
            <Text style={[styles.pillLabel, { color: theme.primaryContrast }]}>Ingresos</Text>
            <Text style={[styles.pillValue, { color: theme.primaryContrast }]}>
              {mask(balance.incomeCents)}
            </Text>
          </View>
        </View>
        <View style={styles.pill}>
          <Ionicons name="arrow-up-circle" size={16} color={theme.accent} />
          <View>
            <Text style={[styles.pillLabel, { color: theme.primaryContrast }]}>Gastos</Text>
            <Text style={[styles.pillValue, { color: theme.primaryContrast }]}>
              {mask(balance.expenseCents)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.85,
  },
  eye: {
    padding: Spacing.half,
  },
  amount: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  breakdown: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pillLabel: {
    fontSize: 11,
    opacity: 0.8,
  },
  pillValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
