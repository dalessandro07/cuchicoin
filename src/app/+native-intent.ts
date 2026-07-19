/**
 * Redirects OS share-intent deep links into the scan-receipt modal.
 * Required by expo-share-intent + expo-router.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: string;
}): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getShareExtensionKey } = require('expo-share-intent') as {
      getShareExtensionKey: () => string;
    };
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return '/(app)/scan-receipt';
    }
    return path;
  } catch {
    return path;
  }
}
