import { useContext } from 'react';

import { HomeContext } from '@/context/home-context';

export function useHome() {
  const ctx = useContext(HomeContext);
  if (!ctx) {
    throw new Error('useHome must be used inside <HomeProvider>');
  }
  return ctx;
}
