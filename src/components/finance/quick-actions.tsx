import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type QuickActionsProps = {
  onExpense: () => void;
  onIncome: () => void;
};

export function QuickActions({ onExpense, onIncome }: QuickActionsProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onExpense}
        accessibilityRole="button"
        accessibilityLabel="Registrar gasto"
        style={({ pressed }) => [
          styles.action,
          { backgroundColor: theme.background, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.danger}1A` }]}>
          <Ionicons name="remove" size={26} color={theme.danger} />
        </View>
        <Text style={[styles.label, { color: theme.text }]}>Registrar gasto</Text>
      </Pressable>

      <Pressable
        onPress={onIncome}
        accessibilityRole="button"
        accessibilityLabel="Registrar ingreso"
        style={({ pressed }) => [
          styles.action,
          { backgroundColor: theme.background, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.success}1A` }]}>
          <Ionicons name="add" size={26} color={theme.success} />
        </View>
        <Text style={[styles.label, { color: theme.text }]}>Registrar ingreso</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
