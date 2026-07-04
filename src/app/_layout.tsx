/**
 * Root layout. Always mounts a Stack with both auth and app groups so each
 * group can run its own auth gate (Redirect only works inside a Navigator).
 *
 *   loading            -> groups return null while hydrating
 *   unauthenticated    -> (auth) renders, (app) redirects to /login
 *   authenticated      -> (app) renders, (auth) redirects to /
 */

import * as SplashScreen from 'expo-splash-screen';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/context/auth-context';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    primary: Colors.primary,
  },
};

function ThemedShell({ children }: { children: ReactNode }) {
  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemedShell>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </ThemedShell>
        <AnimatedSplashOverlay />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
