import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/finance/empty-state';
import { MonthSection } from '@/components/finance/month-section';
import { TransactionRow } from '@/components/finance/transaction-row';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAsyncData } from '@/hooks/use-async-data';
import { useHome } from '@/hooks/use-home';
import { useMoneyVisibility } from '@/hooks/use-money-visibility';
import { useTheme } from '@/hooks/use-theme';
import { financeApi } from '@/lib/api-client';
import type { TransactionView } from '@/lib/db-types';

function MonthList({ homeId, hidden }: { homeId: string; hidden: boolean }) {
  const theme = useTheme();
  const { data: months, loading, error } = useAsyncData(
    () => financeApi.listMonths(homeId),
    `months:${homeId}`,
  );

  const [expanded, setExpanded] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, TransactionView[]>>({});
  const [loadingMonth, setLoadingMonth] = useState<string | null>(null);

  const toggle = useCallback(
    async (month: string) => {
      if (expanded === month) {
        setExpanded(null);
        return;
      }
      setExpanded(month);
      if (!cache[month]) {
        setLoadingMonth(month);
        try {
          const items = await financeApi.listTransactions(homeId, { month });
          setCache((prev) => ({ ...prev, [month]: items }));
        } finally {
          setLoadingMonth(null);
        }
      }
    },
    [expanded, cache, homeId],
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} color={theme.primary} />;
  }

  if (error) {
    return <EmptyState icon="cloud-offline-outline" title="No se pudo cargar" message={error} />;
  }

  if (!months || months.length === 0) {
    return (
      <EmptyState
        icon="time-outline"
        title="Sin movimientos todavía"
        message="Cuando registres gastos o ingresos, aquí verás tu historial por mes."
      />
    );
  }

  return (
    <View style={styles.sections}>
      {months.map((bucket) => (
        <MonthSection
          key={bucket.month}
          bucket={bucket}
          expanded={expanded === bucket.month}
          hidden={hidden}
          onToggle={toggle}>
          {loadingMonth === bucket.month ? (
            <ActivityIndicator style={styles.loader} color={theme.primary} />
          ) : (
            (cache[bucket.month] ?? []).map((transaction, idx, arr) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                hidden={hidden}
                onPress={(t) => router.push({ pathname: '/(app)/transaction', params: { id: t.id } })}
                showDivider={idx < arr.length - 1}
              />
            ))
          )}
        </MonthSection>
      ))}
    </View>
  );
}

export default function HistoryScreen() {
  const { currentHome, dataVersion } = useHome();
  const { hidden } = useMoneyVisibility();
  const theme = useTheme();

  if (!currentHome) return null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={[styles.heading, { color: theme.text }]}>Historial</Text>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <MonthList key={`${currentHome.id}:${dataVersion}`} homeId={currentHome.id} hidden={hidden} />
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
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  sections: {
    gap: Spacing.three,
  },
  loader: {
    paddingVertical: Spacing.four,
  },
});
