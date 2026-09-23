import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';

/**
 * Back that always lands somewhere. A screen opened with nothing under it —
 * from a link, or after a relaunch — has no history, and `router.back()` then
 * does nothing; there it replaces itself with `fallback`, the screen it is
 * normally opened from.
 */
export function useBack(fallback: Href): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [router, fallback]);
}
