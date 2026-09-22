import type { ExpoConfig } from 'expo/config';
import { theme } from '@alke/theme';

/**
 * Native config. It reads @alke/theme so no colour is written twice.
 *
 * OPEN (PLAN.md §8 #14): the bundle identifier below is provisional. The
 * domain and bundle id are Stavros's decision and nothing has been filed.
 */
const config: ExpoConfig = {
  name: 'Alke',
  slug: 'alke',
  version: '0.0.0',
  orientation: 'portrait',
  scheme: 'alke',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  ios: {
    bundleIdentifier: 'com.stavroskaloumenos.alke',
    supportsTablet: false,
  },
  android: {
    package: 'com.stavroskaloumenos.alke',
    adaptiveIcon: {
      backgroundColor: theme.light.bg,
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  plugins: [
    'expo-router',
    // The session token lives in the Keychain, not in plain storage
    // (PLAN.md §5).
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        backgroundColor: theme.light.bg,
        dark: { backgroundColor: theme.dark.bg },
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
