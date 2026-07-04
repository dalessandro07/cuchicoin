import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TermsCheckboxProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  error?: string;
};

export function TermsCheckbox({ value, onValueChange, onOpenTerms, onOpenPrivacy, error }: TermsCheckboxProps) {
  const theme = useTheme();
  const accent = error ? theme.danger : theme.accent;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value }}
        onPress={() => onValueChange(!value)}
        style={styles.row}
        hitSlop={6}>
        <Ionicons
          name={value ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={value ? accent : theme.textSecondary}
        />
        <View style={styles.labelWrap}>
          <Text style={[styles.text, { color: theme.text }]}>
            Acepto los{' '}
            <Text
              style={{ color: theme.accent, fontWeight: '700' }}
              onPress={onOpenTerms}>
              Términos
            </Text>{' '}
            y la{' '}
            <Text
              style={{ color: theme.accent, fontWeight: '700' }}
              onPress={onOpenPrivacy}>
              Política de Privacidad
            </Text>
          </Text>
        </View>
      </Pressable>
      {error ? (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.half,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  labelWrap: {
    flex: 1,
    paddingTop: 2,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    fontSize: 12,
    marginLeft: 32,
  },
});
