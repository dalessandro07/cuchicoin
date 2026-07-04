import { StyleSheet, Text, View } from 'react-native';

import type { Member } from '@/lib/db-types';
import { useTheme } from '@/hooks/use-theme';

export type MemberAvatarProps = {
  member: Member;
  size?: 'sm' | 'md' | 'lg';
};

function getInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || '?';
}

const SIZE_MAP = {
  sm: 28,
  md: 36,
  lg: 48,
} as const;

const FONT_MAP = {
  sm: 11,
  md: 13,
  lg: 16,
} as const;

export function MemberAvatar({ member, size = 'md' }: MemberAvatarProps) {
  const theme = useTheme();
  const px = SIZE_MAP[size];
  const fs = FONT_MAP[size];
  return (
    <View
      style={[
        styles.container,
        {
          width: px,
          height: px,
          borderRadius: px / 2,
          backgroundColor: theme.accent,
        },
      ]}
      accessibilityLabel={`${member.firstName} ${member.lastName}`.trim()}>
      <Text style={[styles.initials, { fontSize: fs, color: theme.primaryContrast }]}>
        {getInitials(member.firstName, member.lastName)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
