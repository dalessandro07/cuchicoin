import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSoles } from '@/lib/money';

export type CategoryBarProps = {
  label: string;
  color: string;
  amountCents: number;
  totalCents: number;
  hidden?: boolean;
};

export function CategoryBar({ label, color, amountCents, totalCents, hidden }: CategoryBarProps) {
  const theme = useTheme();
  const pct = totalCents > 0 ? Math.round((amountCents / totalCents) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={[styles.amount, { color: theme.text }]}>
          {hidden ? '••••' : formatSoles(amountCents)}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.pct, { color: theme.textSecondary }]}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  pct: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
});
