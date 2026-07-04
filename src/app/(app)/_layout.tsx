import { Redirect, Slot } from 'expo-router';

import { HomeProvider } from '@/context/home-context';
import { useAuth } from '@/hooks/use-auth';

export default function AppLayout() {
  const { status } = useAuth();

  if (status === 'loading') return null;
  if (status === 'unauthenticated') return <Redirect href="/(auth)/login" />;

  return (
    <HomeProvider>
      <Slot />
    </HomeProvider>
  );
}
