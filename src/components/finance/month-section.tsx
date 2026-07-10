import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMonthLabel, formatSoles } from '@/lib/money';
import type { MonthBucket } from '@/lib/db-types';

export type MonthSectionProps = {
  bucket: MonthBucket;
  expanded: boolean;
  hidden?: boolean;
  onToggle: (month: string) => void;
  children?: ReactNode;
};

export function MonthSection({ bucket, expanded, hidden, onToggle, children }: MonthSectionProps) {
  const theme = useTheme();
  const positive = bucket.balanceCents >= 0;

  return (
    <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.background }]}>
      <Pressable
        onPress={() => onToggle(bucket.month)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.7 : 1 }]}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={theme.textSecondary}
          />
          <View>
            <Text style={[styles.month, { color: theme.text }]}>{formatMonthLabel(bucket.month)}</Text>
            <Text style={[styles.count, { color: theme.textSecondary }]}>
              {bucket.count} {bucket.count === 1 ? 'movimiento' : 'movimientos'}
            </Text>
          </View>
        </View>
        <Text style={[styles.balance, { color: positive ? theme.success : theme.danger }]}>
          {hidden ? '••••' : formatSoles(bucket.balanceCents)}
        </Text>
      </Pressable>

      {expanded ? (
        <View style={[styles.body, { borderTopColor: theme.border }]}>{children}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  month: {
    fontSize: 15,
    fontWeight: '700',
  },
  count: {
    fontSize: 12,
    marginTop: 1,
  },
  balance: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  body: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
  },
});
