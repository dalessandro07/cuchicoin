import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSignedSoles } from '@/lib/money';
import type { IconName } from '@/constants/category-options';
import type { TransactionView } from '@/lib/db-types';

export type TransactionRowProps = {
  transaction: TransactionView;
  hidden?: boolean;
  onPress?: (transaction: TransactionView) => void;
  showDivider?: boolean;
};

function authorInitials(t: TransactionView): string {
  const first = t.authorFirstName?.trim().charAt(0) ?? '';
  const last = t.authorLastName?.trim().charAt(0) ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

function timeLabel(seconds: number): string {
  const date = new Date(seconds * 1000);
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

export function TransactionRow({ transaction, hidden, onPress, showDivider }: TransactionRowProps) {
  const theme = useTheme();
  const isIncome = transaction.type === 'income';
  const circleColor = transaction.categoryColor ?? theme.textSecondary;
  const icon = (transaction.categoryIcon as IconName) ?? 'pricetag-outline';
  const amountColor = isIncome ? theme.success : theme.text;

  const title = transaction.categoryName ?? 'Sin categoría';
  const subtitle = transaction.description?.trim()
    ? transaction.description.trim()
    : timeLabel(transaction.createdAt);

  return (
    <Pressable
      onPress={onPress ? () => onPress(transaction) : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
        { opacity: pressed && onPress ? 0.6 : 1 },
      ]}>
      <View style={[styles.iconCircle, { backgroundColor: `${circleColor}22` }]}>
        <Ionicons name={icon} size={20} color={circleColor} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.authorBadge, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={[styles.authorText, { color: theme.textSecondary }]}>{authorInitials(transaction)}</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <Text style={[styles.amount, { color: amountColor }]}>
        {hidden ? '••••••' : formatSignedSoles(transaction.amount, transaction.type)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  authorBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    flexShrink: 1,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
