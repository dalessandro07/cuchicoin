import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AmountInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  tint?: string;
  autoFocus?: boolean;
};

export function AmountInput({ value, onChangeText, tint, autoFocus }: AmountInputProps) {
  const theme = useTheme();
  const color = tint ?? theme.text;

  const sanitize = (text: string) => {
    const cleaned = text.replace(/[^\d.,]/g, '').replace(/,/g, '.');
    const parts = cleaned.split('.');
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    const [intPart, decPart] = normalized.split('.');
    onChangeText(decPart !== undefined ? `${intPart}.${decPart.slice(0, 2)}` : normalized);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.symbol, { color }]}>S/</Text>
      <TextInput
        value={value}
        onChangeText={sanitize}
        placeholder="0.00"
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        autoFocus={autoFocus}
        style={[styles.input, { color }]}
        accessibilityLabel="Monto"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  symbol: {
    fontSize: 32,
    fontWeight: '700',
  },
  input: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
    minWidth: 120,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
