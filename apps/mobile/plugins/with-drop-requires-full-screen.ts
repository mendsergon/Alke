import { withInfoPlist, type ConfigPlugin } from '@expo/config-plugins';

/**
 * Drops `UIRequiresFullScreen` from the generated Info.plist.
 *
 * Xcode 26 warns on it: "'UIRequiresFullScreen' has been deprecated starting
 * in iOS 26.0 and will be ignored in a future release." It is the only warning
 * Alke's own target produces, and it is ours rather than a package's — proved
 * by building a stock Expo app of the same SDK twice, once at 16.4 and once at
 * 26.0: the key is written in both, and only the 26.0 build warns. Our floor
 * is what surfaces it.
 *
 * The key exists unconditionally because Expo writes
 * `UIRequiresFullScreen = !!ios.requireFullScreen`
 * (`@expo/config-plugins@57.0.9/build/ios/RequiresFullScreen.js:56`), so an app
 * that never opts in still ships it as `false`.
 *
 * It is safe to remove here because the key only governs iPad Slide Over and
 * Split View, and Alke is iPhone-only: `ios.supportsTablet` is false and the
 * generated project carries `TARGETED_DEVICE_FAMILY = 1`. Deleting it changes
 * no behaviour — it removes a key that already did nothing on this app and
 * which Apple has deprecated. Nothing is suppressed; the declaration the
 * warning is about is gone.
 *
 * The preconditions are asserted, so the day Alke supports iPad this fails the
 * prebuild rather than silently dropping a key that would then matter.
 */
const withDropRequiresFullScreen: ConfigPlugin = (config) => {
  return withInfoPlist(config, (cfg) => {
    if (cfg.ios?.supportsTablet || cfg.ios?.isTabletOnly) {
      throw new Error(
        'with-drop-requires-full-screen: this app now targets iPad, where UIRequiresFullScreen ' +
          'is meaningful. Decide what it should be instead of deleting it.',
      );
    }

    if (cfg.modResults.UIRequiresFullScreen === true) {
      throw new Error(
        'with-drop-requires-full-screen: UIRequiresFullScreen is true, so something is asking ' +
          'for it. Removing it would change behaviour.',
      );
    }

    if (!('UIRequiresFullScreen' in cfg.modResults)) {
      throw new Error(
        'with-drop-requires-full-screen: UIRequiresFullScreen is not in the Info.plist. Expo has ' +
          'stopped writing it, so delete this plugin rather than leaving a no-op in the build.',
      );
    }

    delete cfg.modResults.UIRequiresFullScreen;
    return cfg;
  });
};

export default withDropRequiresFullScreen;
