import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PERU_PHONE_PREFIX } from '@/constants/auth';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PhoneInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  onBlur?: () => void;
};

export function PhoneInput({ label, value, onChangeText, error, onBlur }: PhoneInputProps) {
  const theme = useTheme();
  const borderColor = error ? theme.danger : theme.border;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.wrapper,
          { backgroundColor: theme.background, borderColor },
        ]}>
        <Ionicons name="call-outline" size={20} color={theme.textSecondary} style={styles.icon} />
        <View
          style={[
            styles.prefix,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement },
          ]}>
          <Text style={[styles.prefixText, { color: theme.text }]}>{PERU_PHONE_PREFIX}</Text>
        </View>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, 9))}
          onBlur={onBlur}
          placeholder="999 999 999"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          maxLength={9}
        />
      </View>
      {error ? (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.three,
    minHeight: 48,
  },
  icon: {
    marginRight: Spacing.two,
  },
  prefix: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginRight: Spacing.two,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  error: {
    fontSize: 12,
    marginLeft: Spacing.one,
    marginTop: Spacing.half,
  },
});
