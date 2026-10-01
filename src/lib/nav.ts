import { router, type Href } from 'expo-router';

/** Close a modal. Falls back to a tab when there's no screen behind it (e.g. opened from a link). */
export function closeTo(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
