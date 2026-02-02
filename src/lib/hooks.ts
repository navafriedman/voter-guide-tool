'use client';

import { useSyncExternalStore } from 'react';

// Hook for handling client-side hydration safely
const emptySubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
