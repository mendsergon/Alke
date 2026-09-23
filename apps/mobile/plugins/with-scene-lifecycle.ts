import { withAppDelegate, withInfoPlist, type ConfigPlugin } from '@expo/config-plugins';

/**
 * Moves the generated iOS app onto the UIScene life cycle.
 *
 * `expo@57.0.24`'s bare template still starts React Native from
 * `application(_:didFinishLaunchingWithOptions:)`, building its window with
 * `UIWindow(frame: UIScreen.main.bounds)` and handling links through
 * `application(_:open:options:)`. All three are deprecated in iOS 26, which
 * is Alke's floor, so the template produces four warnings the moment the
 * project is generated.
 *
 * Expo already ships the replacement: `ExpoAppSceneDelegate`
 * (`expo/ios/AppDelegates/ExpoAppSceneDelegate.swift`), whose own comment says
 * it is "Required by the iOS 27, which asserts at launch unless the app adopts
 * the scene-based life cycle". It builds the window from the connecting
 * `UIWindowScene`, starts React Native into it, and re-feeds URL, activity and
 * quick-action events back to the app delegate — including calling
 * `RCTLinkingManager` itself when the delegate does not
 * (`SceneEventForwarder.swift:22`), which is why the template's own linking
 * override is redundant here rather than merely moved.
 *
 * `apps/mobile/ios/` is generated and gitignored, so this runs as a config
 * plugin: the fix is in the repo and is reapplied by every prebuild.
 *
 * It asserts on every edit. If a future Expo template no longer matches, the
 * prebuild fails loudly instead of quietly leaving the deprecated code in
 * place.
 */
const withSceneLifecycle: ConfigPlugin = (config) => {
  config = withAppDelegate(config, (cfg) => {
    cfg.modResults.contents = toSceneLifecycle(cfg.modResults.contents);
    return cfg;
  });

  config = withInfoPlist(config, (cfg) => {
    // UIKit reads this to find the scene delegate. Without it the app keeps
    // the pre-scene launch path and iOS 27 asserts at start-up.
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

  return config;
};

/** The three deprecated call sites, and the scene delegate that replaces them. */
export function toSceneLifecycle(contents: string): string {
  if (contents.includes('class SceneDelegate')) return contents;

  let out = contents;

  // 1. The delegate has to advertise its factory and window for the scene to
  //    find them (`ExpoReactNativeFactoryProvider.swift:13`).
  out = replaceOnce(
    out,
    'class AppDelegate: ExpoAppDelegate {',
    'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {',
    'app delegate class declaration',
  );

  // 2. The window and the React Native start move to the scene, which is the
  //    only place a `UIWindowScene` exists. This is `UIWindow(frame:)` and
  //    `UIScreen.main`, two of the four deprecations.
  out = replaceOnce(
    out,
    /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/,
    '\n    // The window is built from the connecting scene; see SceneDelegate.\n',
    'window creation block',
  );

  // 3. The linking override is `UIApplication.OpenURLOptionsKey`, the other
  //    two deprecations. The scene's forwarder already reaches
  //    `RCTLinkingManager`, so this is dropped rather than rewritten.
  out = replaceOnce(
    out,
    /\n  \/\/ Linking API\n  public override func application\(\n\s*_ app: UIApplication,\n\s*open url: URL,\n\s*options: \[UIApplication\.OpenURLOptionsKey: Any\] = \[:\]\n\s*\) -> Bool \{\n[\s\S]*?\n  \}\n/,
    '\n',
    'linking override',
  );

  // 4. Declared here rather than in its own file so the Xcode project needs no
  //    edit; Swift does not care which file a class lives in, and the Info.plist
  //    names it as `$(PRODUCT_MODULE_NAME).SceneDelegate` either way.
  out += `
/**
 * Starts React Native into the window of the connecting scene.
 *
 * Everything is inherited: \`ExpoAppSceneDelegate\` creates the window, starts
 * the factory the app delegate built, and forwards scene, URL, activity and
 * quick-action events on to the app delegate.
 */
final class SceneDelegate: ExpoAppSceneDelegate {}
`;

  return out;
}

/** A replacement that refuses to be a no-op. */
function replaceOnce(
  source: string,
  find: string | RegExp,
  replacement: string,
  what: string,
): string {
  const out = source.replace(find as never, replacement);
  if (out === source) {
    throw new Error(
      `with-scene-lifecycle: could not find the ${what} in the generated AppDelegate. ` +
        `The Expo template has changed; update apps/mobile/plugins/with-scene-lifecycle.ts ` +
        `rather than letting the deprecated code through.`,
    );
  }
  return out;
}

export default withSceneLifecycle;
