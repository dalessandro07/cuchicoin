import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type InviteCodeDisplayProps = {
  code: string;
};

export function InviteCodeDisplay({ code }: InviteCodeDisplayProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const spaced = code.split('').join(' ');

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.body}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Código de invitación</Text>
        <Text style={[styles.code, { color: theme.text }]} selectable>
          {spaced}
        </Text>
      </View>
      <Pressable
        onPress={copy}
        accessibilityRole="button"
        accessibilityLabel={copied ? 'Copiado' : 'Copiar código'}
        hitSlop={6}
        style={({ pressed }) => [
          styles.copyButton,
          { backgroundColor: copied ? theme.accent : theme.background, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
        ]}>
        <Ionicons
          name={copied ? 'checkmark' : 'copy-outline'}
          size={18}
          color={copied ? theme.primaryContrast : theme.text}
        />
        <Text style={[styles.copyText, { color: copied ? theme.primaryContrast : theme.text }]}>
          {copied ? 'Copiado' : 'Copiar'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  code: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  copyText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
