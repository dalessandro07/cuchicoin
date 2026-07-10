import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryBar } from '@/components/finance/category-bar';
import { EmptyState } from '@/components/finance/empty-state';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAsyncData } from '@/hooks/use-async-data';
import { useHome } from '@/hooks/use-home';
import { useMoneyVisibility } from '@/hooks/use-money-visibility';
import { useTheme } from '@/hooks/use-theme';
import { financeApi } from '@/lib/api-client';
import { currentMonthKey, formatMonthLabel, formatSoles } from '@/lib/money';

function MonthReport({ homeId, hidden }: { homeId: string; hidden: boolean }) {
  const theme = useTheme();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  const { data: months } = useAsyncData(() => financeApi.listMonths(homeId), `months:${homeId}`);
  const { data: summary, loading } = useAsyncData(
    () => financeApi.getMonthlyReport(homeId, selectedMonth),
    `report:${homeId}:${selectedMonth}`,
  );

  const monthKeys = Array.from(
    new Set<string>([currentMonthKey(), ...(months?.map((m) => m.month) ?? [])]),
  ).sort((a, b) => (a < b ? 1 : -1));

  const expenses = (summary?.byCategory ?? [])
    .filter((c) => c.type === 'expense')
    .sort((a, b) => b.amountCents - a.amountCents);
  const incomes = (summary?.byCategory ?? [])
    .filter((c) => c.type === 'income')
    .sort((a, b) => b.amountCents - a.amountCents);

  const memberMap = new Map<string, { name: string; expense: number; income: number }>();
  for (const m of summary?.byMember ?? []) {
    const key = m.memberId ?? 'none';
    const entry = memberMap.get(key) ?? {
      name: `${m.firstName} ${m.lastName}`.trim() || '—',
      expense: 0,
      income: 0,
    };
    if (m.type === 'expense') entry.expense += m.amountCents;
    else entry.income += m.amountCents;
    memberMap.set(key, entry);
  }
  const memberEntries = Array.from(memberMap.values()).sort((a, b) => b.expense - a.expense);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthTabs}>
        {monthKeys.map((month) => {
          const active = month === selectedMonth;
          return (
            <Pressable
              key={month}
              onPress={() => setSelectedMonth(month)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.monthChip,
                {
                  backgroundColor: active ? theme.primary : theme.backgroundElement,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}>
              <Text
                style={[styles.monthChipText, { color: active ? theme.primaryContrast : theme.textSecondary }]}>
                {formatMonthLabel(month)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading || !summary ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: theme.primary }]}>
            <Text style={[styles.cardLabel, { color: theme.primaryContrast }]}>Balance del mes</Text>
            <Text style={[styles.cardAmount, { color: theme.primaryContrast }]}>
              {hidden ? '••••••' : formatSoles(summary.balanceCents)}
            </Text>
            <View style={styles.cardRow}>
              <Text style={[styles.cardMeta, { color: theme.primaryContrast }]}>
                Ingresos {hidden ? '••••' : formatSoles(summary.incomeCents)}
              </Text>
              <Text style={[styles.cardMeta, { color: theme.primaryContrast }]}>
                Gastos {hidden ? '••••' : formatSoles(summary.expenseCents)}
              </Text>
            </View>
          </View>

          {summary.count === 0 ? (
            <EmptyState
              icon="pie-chart-outline"
              title="Sin movimientos este mes"
              message="Elige otro mes o registra un movimiento."
            />
          ) : (
            <>
              {expenses.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Gastos por categoría</Text>
                  <View style={[styles.panel, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    {expenses.map((c) => (
                      <CategoryBar
                        key={`${c.categoryId ?? 'none'}-e`}
                        label={c.name}
                        color={c.color ?? theme.danger}
                        amountCents={c.amountCents}
                        totalCents={summary.expenseCents}
                        hidden={hidden}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {incomes.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Ingresos por categoría</Text>
                  <View style={[styles.panel, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    {incomes.map((c) => (
                      <CategoryBar
                        key={`${c.categoryId ?? 'none'}-i`}
                        label={c.name}
                        color={c.color ?? theme.success}
                        amountCents={c.amountCents}
                        totalCents={summary.incomeCents}
                        hidden={hidden}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {memberEntries.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Aporte por miembro</Text>
                  <View style={[styles.panel, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    {memberEntries.map((m, idx) => (
                      <View
                        key={m.name + idx}
                        style={[
                          styles.memberRow,
                          idx < memberEntries.length - 1 && {
                            borderBottomColor: theme.border,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                          },
                        ]}>
                        <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
                          {m.name}
                        </Text>
                        <View style={styles.memberAmounts}>
                          <Text style={[styles.memberExpense, { color: theme.text }]}>
                            {hidden ? '••••' : `- ${formatSoles(m.expense, { withSymbol: false })}`}
                          </Text>
                          <Text style={[styles.memberIncome, { color: theme.success }]}>
                            {hidden ? '••••' : `+ ${formatSoles(m.income, { withSymbol: false })}`}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )}
        </View>
      )}
    </>
  );
}

export default function ReportsScreen() {
  const { currentHome, dataVersion } = useHome();
  const { hidden } = useMoneyVisibility();
  const theme = useTheme();

  if (!currentHome) return null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={[styles.heading, { color: theme.text }]}>Reportes</Text>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <MonthReport key={`${currentHome.id}:${dataVersion}`} homeId={currentHome.id} hidden={hidden} />
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
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  scroll: {
    paddingBottom: Spacing.six,
  },
  monthTabs: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  monthChip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  monthChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  cardLabel: {
    fontSize: 13,
    opacity: 0.85,
    fontWeight: '600',
  },
  cardAmount: {
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  cardMeta: {
    fontSize: 13,
    opacity: 0.9,
    fontWeight: '600',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  panel: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  memberAmounts: {
    alignItems: 'flex-end',
  },
  memberExpense: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  memberIncome: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  loader: {
    paddingVertical: Spacing.six,
  },
});
