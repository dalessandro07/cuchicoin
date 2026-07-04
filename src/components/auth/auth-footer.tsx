import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AuthFooterProps = {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
};

export function AuthFooter({ prompt, actionLabel, onPress }: AuthFooterProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: theme.textSecondary }]}>{prompt}</Text>
      <Pressable onPress={onPress} hitSlop={6} accessibilityRole="link">
        <Text style={[styles.action, { color: theme.accent }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
  prompt: {
    fontSize: 14,
  },
  action: {
    fontSize: 14,
    fontWeight: '700',
  },
});
