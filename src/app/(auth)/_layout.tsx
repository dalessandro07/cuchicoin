import { Redirect, Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

export default function AuthLayout() {
  const theme = useTheme();
  const { status, session } = useAuth();

  if (status === 'loading') return null;
  if (session) return <Redirect href="/(app)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: Platform.select({ ios: 'default', android: 'slide_from_right', default: 'default' }),
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen
        name="terms"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
