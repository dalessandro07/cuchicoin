import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:8081',
  plugins: [
    // biome-ignore lint/suspicious/noExplicitAny: transitive @better-fetch dependency version mismatch
    expoClient({
      scheme: 'kuchicoin',
      storagePrefix: 'kuchicoin',
      storage: SecureStore,
    }) as any,
  ],
});
