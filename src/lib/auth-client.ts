import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/constants/api';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    // biome-ignore lint/suspicious/noExplicitAny: transitive @better-fetch dependency version mismatch
    expoClient({
      scheme: 'kuchicoin',
      storagePrefix: 'kuchicoin',
      storage: SecureStore,
    }) as any,
  ],
});
