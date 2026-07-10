import { StyleSheet, Text, Pressable, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CategoryType } from '@/lib/db-types';

export type TypeToggleProps = {
  value: CategoryType;
  onChange: (value: CategoryType) => void;
};

export function TypeToggle({ value, onChange }: TypeToggleProps) {
  const theme = useTheme();

  const options: { key: CategoryType; label: string; color: string }[] = [
    { key: 'expense', label: 'Gasto', color: theme.danger },
    { key: 'income', label: 'Ingreso', color: theme.success },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {options.map((option) => {
        const active = value === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: option.color }]}>
            <Text
              style={[
                styles.label,
                { color: active ? theme.primaryContrast : theme.textSecondary },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
});
