import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { IconName } from '@/constants/category-options';
import type { Category } from '@/lib/db-types';

export type CategoryPickerProps = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onManage?: () => void;
};

export function CategoryPicker({ categories, selectedId, onSelect, onManage }: CategoryPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Categoría</Text>
        {onManage ? (
          <Pressable onPress={onManage} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.manage, { color: theme.accent }]}>Gestionar</Text>
          </Pressable>
        ) : null}
      </View>

      {categories.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          No hay categorías de este tipo. Crea una desde “Gestionar”.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}>
          {categories.map((category) => {
            const active = category.id === selectedId;
            return (
              <Pressable
                key={category.id}
                onPress={() => onSelect(category.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? `${category.color}22` : theme.backgroundElement,
                    borderColor: active ? category.color : theme.border,
                  },
                ]}>
                <View style={[styles.chipIcon, { backgroundColor: `${category.color}22` }]}>
                  <Ionicons name={category.icon as IconName} size={18} color={category.color} />
                </View>
                <Text
                  style={[styles.chipLabel, { color: active ? theme.text : theme.textSecondary }]}
                  numberOfLines={1}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  manage: {
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    fontSize: 13,
    lineHeight: 19,
  },
  list: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 180,
  },
  chipIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
});
