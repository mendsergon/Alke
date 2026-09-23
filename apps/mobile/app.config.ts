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
    // The lowest iOS a device can have to install Alke. Liquid Glass
    // (`UIGlassEffect`) is iOS 26, and the app is built on it.
    deploymentTarget: '26.0',
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
    // Moves the generated app onto the UIScene life cycle. Expo's bare
    // template still uses the pre-scene launch path, which is deprecated at
    // our iOS 26 floor and asserts at launch on iOS 27.
    './plugins/with-scene-lifecycle',
    // Expo's own deployment-target plugin only reaches the app target, so the
    // PBXProject's configurations keep the template's floor. This puts
    // `ios.deploymentTarget` on those too.
    './plugins/with-project-deployment-target',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
