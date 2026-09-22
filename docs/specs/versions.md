# Pinned versions

PLAN.md §4: when a package is added, its version is verified from official
sources and recorded here with the source URL.

> This file was recreated on 22 September 2026. The previous version is
> deleted in the working tree and that deletion is still awaiting a decision;
> the entries below cover only what has been added since.

## Orb animations

| Package | Version | Licence | Source |
|---|---|---|---|
| `thinking-orbs` | 0.3.1 | MIT | https://www.npmjs.com/package/thinking-orbs — `npm view thinking-orbs version` |
| `@shopify/react-native-skia` | 2.6.2 | MIT | version chosen by `npx expo install` for Expo SDK 57 |
| `thinking-orbs-native` | vendored, upstream 0.1.0 | MIT | https://github.com/Jakubantalik/thinking-orbs `ports/react-native/thinking-orbs-native` — not published to npm |

Notes.

- `thinking-orbs` is the web package. It is installed for one reason: its
  `thinking-orbs/engine` export is the React-free frame maths the React
  Native port draws from. No web component is imported.
- The React Native port is vendored at `apps/mobile/src/vendor/thinking-orbs-native`
  because it has no npm release. Its MIT notice travels with it.
- Upstream states the port is **not yet runtime-verified on a device or
  simulator** and says not to ship it to users until it is.
- Skia is a native module. Expo Go can no longer run this app, and the iOS
  project needs a rebuild before the orbs will render.
- `react-native-reanimated` 4.5.1 was already present and satisfies the
  port's `>=3.0.0` peer requirement.

## Build settings

- `pnpm-workspace.yaml` sets `allowBuilds: '@shopify/react-native-skia': true`.
  pnpm 12 blocks dependency install scripts by default; Skia's copies its
  prebuilt xcframeworks into place and the package does not work without it.

## The sign-in gate's material

| Package | Version | Licence | Source |
|---|---|---|---|
| `expo-glass-effect` | 57.0.3 | MIT | chosen by `npx expo install expo-glass-effect` for Expo SDK 57 — https://www.npmjs.com/package/expo-glass-effect |

Notes.

- `expo-glass-effect` wraps iOS 26's `UIGlassEffect`. That is Liquid Glass
  proper: it refracts what is behind it, where `expo-blur`'s `UIBlurEffect`
  only blurs. The gate needs the refraction, so `expo-blur` stays as the
  fallback rather than being replaced.
- `isGlassEffectAPIAvailable()` is checked before the view is rendered.
  Upstream added it because some iOS 26 betas ship without the API and
  touching it there crashes. It returns `true` on the iOS 26.5 simulator,
  confirmed by rendering both paths and diffing the frames.
- It is a native module, so the iOS project needs a rebuild. A clean
  checkout cannot run this on Expo Go.
