import { Redirect, Slot } from 'expo-router';

import { useHome } from '@/hooks/use-home';

export default function HomeLayout() {
  const { status } = useHome();
  if (status === 'loading') return null;
  if (status === 'no-home') return <Redirect href="/(app)" />;
  return <Slot />;
}
