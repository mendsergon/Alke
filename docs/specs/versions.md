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

## Reanimated is not broken

An earlier session recorded that `react-native-reanimated` 4.5.1 and
`react-native-worklets` 0.10.1 were installed but dead, because the repository
has no `babel.config.js`. That is wrong and nothing should be built around it.

- `@expo/metro-config/build/loadBabelConfig.js` falls back to
  `expo/internal/babel-preset` when the project root has no Babel config file.
- `babel-preset-expo/build/configs/expo.js` adds `react-native-worklets/plugin`
  automatically whenever that package resolves, which it does here.
- Transforming a `useAnimatedStyle` file through that exact configuration
  emits `__workletHash` and `initData`. The worklets are real.

## The orbs, vendored and seen running

`thinking-orbs-native` 0.1.0 (MIT, upstream `ports/react-native/thinking-orbs-native`,
not published to npm) is now copied into
`apps/mobile/src/vendor/thinking-orbs-native` — four files and the MIT notice.
It draws with `@shopify/react-native-skia` and takes its geometry from
`thinking-orbs/engine`, the same compiled frame maths the web component runs.

- **Upstream's "not yet runtime-verified on a device or simulator" no longer
  holds for iOS.** All nine states at both sizes were rendered on the iOS 26.5
  simulator and confirmed animating across successive frames. Android and a
  physical device are still unseen.
- **Theme:** the port's `auto` reads `useColorScheme()`, which is the OS
  appearance, not Alke's. PLAN.md §3 makes dark the app's default and follows
  the OS only when the user picks "system", so every orb must be passed
  `theme` from `useTheme().scheme` explicitly. `auto` is wrong here.
- **Cost:** the port calls `setState` once per frame to hand a new `SkPicture`
  to the canvas, which is a React render at 60fps. Rasterisation is still on
  the UI thread, and one orb on an otherwise idle loading screen is within
  budget, but this is not something to put in a list or behind a busy screen.

> **OPEN — the vendored port is invisible to git.** `.gitignore` line 41 is
> `vendor/`, unanchored, so it matches `apps/mobile/src/vendor/` as well as the
> repository-root reference clones. The port is therefore untracked and would
> not survive a clean checkout. Two ways out — anchor the rule to `/vendor/`,
> or move the port to a directory not called `vendor`. Stavros decides; nothing
> has been changed.

## Backend

| Package | Version | Licence | Source |
|---|---|---|---|
| `github.com/pocketbase/pocketbase` | v0.40.4 | MIT | https://github.com/pocketbase/pocketbase/releases/tag/v0.40.4 — latest non-prerelease, published 2026-09-12, read from the GitHub releases API |
| Go toolchain | 1.27 | BSD-3-Clause | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.4/go.mod — the pinned tag's own `go` directive |

Notes.

- PLAN.md §4 pins an exact tag because PocketBase is pre-1.0. v0.40.4 is that
  tag; every upgrade needs its changelog read first.
- The licence was read from
  https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.4/LICENSE.md
  — MIT, so no copyleft question under PLAN.md §4.
- pocketbase.io/docs/go-overview states Go 1.23+; the pinned tag's `go.mod`
  requires 1.27. The tag wins.
- OPEN: the Go module path is `alke/backend`, a local name. PLAN.md fixes no
  module path and there is no decision on where the backend is hosted.

## Session storage

| Package | Version | Licence | Source |
|---|---|---|---|
| `expo-secure-store` | 57.0.4 | MIT | chosen by `npx expo install` for Expo SDK 57; licence read from the installed package's `package.json` |

The session token is written to the iOS Keychain rather than to plain storage,
per PLAN.md §5.
