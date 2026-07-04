import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeBalanceCard } from '@/components/home/home-balance-card';
import { InviteCodeDisplay } from '@/components/home/invite-code-display';
import { MemberList } from '@/components/home/member-list';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useHome } from '@/hooks/use-home';
import { useTheme } from '@/hooks/use-theme';

export default function HomeDashboardScreen() {
  const { currentHome, currentMember, members, leaveHome, syncNow, isSyncing } = useHome();
  const theme = useTheme();
  const [leaving, setLeaving] = useState(false);

  if (!currentHome) return null;

  const confirmLeave = () => {
    Alert.alert(
      'Salir del hogar',
      '¿Estás seguro? Si eres el único administrador, el hogar será eliminado para todos los miembros.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              await leaveHome();
            } catch (err) {
              const message = err instanceof Error ? err.message : 'No se pudo salir del hogar';
              Alert.alert('Error', message);
            } finally {
              setLeaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                {currentHome.name}
              </Text>
              <Pressable
                onPress={syncNow}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Sincronizar"
                style={({ pressed }) => [styles.syncButton, { opacity: pressed || isSyncing ? 0.6 : 1 }]}>
                <Ionicons
                  name={isSyncing ? 'sync' : 'sync-outline'}
                  size={18}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {currentHome.currency} · código {currentHome.inviteCode}
            </Text>
          </View>

          <InviteCodeDisplay code={currentHome.inviteCode} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Miembros ({members.length})
            </Text>
            <MemberList members={members} currentMemberId={currentMember?.id ?? null} />
          </View>

          <HomeBalanceCard memberCount={members.length} />

          <Pressable
            onPress={confirmLeave}
            disabled={leaving}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.leaveButton,
              { borderColor: theme.danger, opacity: pressed || leaving ? 0.6 : 1 },
            ]}>
            <Ionicons name="exit-outline" size={18} color={theme.danger} />
            <Text style={[styles.leaveText, { color: theme.danger }]}>
              {leaving ? 'Saliendo…' : 'Salir del hogar'}
            </Text>
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
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    flex: 1,
  },
  syncButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 13,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
  },
  leaveText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
