import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BRAND } from '@/constants/brand';
import { Spacing } from '@/constants/theme';

export function AuthHeader() {
  return (
    <View style={styles.container}>
      <Image source={BRAND.logoSource} style={styles.logo} resizeMode="contain" />
      <ThemedText type="small" themeColor="textSecondary" style={styles.slogan}>
        {BRAND.slogan}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.four,
  },
  logo: {
    width: 96,
    height: 96,
  },
  slogan: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
});
