# Versions

Every version below was verified live against an official source on the date shown. Nothing here is pinned from memory (PLAN.md §4).

**Verified:** 2026-09-21. **Verified by:** query against `registry.npmjs.org`, `api.github.com`, and the vendors' own documentation.

Re-verify before Phase 1 starts and at the start of every later phase. PocketBase is pre-1.0 and ships every few days; re-read its changelog before every bump.

---

## 1. Pins

| Component | Pin | Latest published | Source | Verified |
|---|---|---|---|---|
| Expo SDK | **57** (`expo@57.0.24`) | 57.0.24 — 2026-09-18 | <https://registry.npmjs.org/expo/latest>, <https://expo.dev/changelog/sdk-57> | 2026-09-21 |
| React Native | **0.86.3** | 0.87.1 — 2026-08-26 (**do not use**, see §2.1) | <https://registry.npmjs.org/react-native>, dist-tag `0.86-stable` | 2026-09-21 |
| React | **19.2.3** | 19.3.0 — 2026-09-09 (**do not use**, see §2.1) | `expo@57.0.24` devDependencies | 2026-09-21 |
| expo-router | **57.0.22** | 57.0.22 — 2026-09-18 | <https://registry.npmjs.org/expo-router/latest> | 2026-09-21 |
| expo-sqlite | **57.0.3** | 57.0.3 — 2026-09-11 | <https://registry.npmjs.org/expo-sqlite/latest> | 2026-09-21 |
| op-sqlite | **18.2.5** | 18.2.5 — 2026-09-20 | <https://registry.npmjs.org/@op-engineering/op-sqlite/latest>, <https://github.com/OP-Engineering/op-sqlite/releases> | 2026-09-21 |
| expo-secure-store | **57.0.4** | 57.0.4 | <https://registry.npmjs.org/expo-secure-store/latest> | 2026-09-21 |
| drizzle-orm | **0.45.3** | 0.45.3 — 2026-09-21 | <https://registry.npmjs.org/drizzle-orm/latest> | 2026-09-21 |
| drizzle-kit | **0.31.11** | 0.31.11 — 2026-09-21 | <https://registry.npmjs.org/drizzle-kit/latest> | 2026-09-21 |
| PocketBase | **v0.40.4** | v0.40.4 — 2026-09-12 | <https://github.com/pocketbase/pocketbase/releases/latest> | 2026-09-21 |
| Go (for the PocketBase extension) | **1.27** | — | `go 1.27` in <https://raw.githubusercontent.com/pocketbase/pocketbase/master/go.mod> | 2026-09-21 |
| victory-native | **42.0.1** | 42.0.1 — 2026-08-31 | <https://registry.npmjs.org/victory-native/latest> | 2026-09-21 |
| @shopify/react-native-skia | **2.12.0** | 2.12.0 — 2026-09-16 | <https://registry.npmjs.org/@shopify/react-native-skia> | 2026-09-21 |
| react-native-svg | **15.15.5** | 15.15.5 | <https://registry.npmjs.org/react-native-svg/latest> | 2026-09-21 |
| react-native-reanimated | **4.7.0** | 4.7.0 | <https://registry.npmjs.org/react-native-reanimated/latest> | 2026-09-21 |
| react-native-gesture-handler | **3.3.0** | 3.3.0 | <https://registry.npmjs.org/react-native-gesture-handler/latest> | 2026-09-21 |
| RevenueCat RN SDK (`react-native-purchases`) | **10.10.1** | 10.10.1 — 2026-09-21 | <https://registry.npmjs.org/react-native-purchases/latest>, <https://github.com/RevenueCat/react-native-purchases/releases> | 2026-09-21 |
| pnpm | **12.5.1** | 12.5.1 — 2026-09-18 | <https://registry.npmjs.org/pnpm/latest>, <https://github.com/pnpm/pnpm/releases> | 2026-09-21 |
| Vitest | **5.0.1** | 5.0.1 — 2026-09-15 | <https://registry.npmjs.org/vitest/latest>, <https://github.com/vitest-dev/vitest/releases> | 2026-09-21 |

---

## 2. Findings that change what we pin

### 2.1 React Native and React must NOT be pinned to their own latest

`react-native@latest` on npm is **0.87.1**, and `react@latest` is **19.3.0**. Expo SDK 57 is built against **React Native 0.86.3** and **React 19.2.3** (`expo@57.0.24` devDependencies).

Pin 0.86.3 and 19.2.3. Install through `npx expo install` so the SDK resolves the matching versions rather than npm's `latest` tag. The `0.86-stable` dist-tag currently resolves to 0.86.3.

Source: `expo@57.0.24` package metadata; <https://registry.npmjs.org/react-native> dist-tags. Verified 2026-09-21.

### 2.2 Expo SDK 58 is in beta — do not adopt

Expo SDK 58 Beta was announced 2026-09-15. SDK 57 (released 2026-06-30) is the current stable SDK. Phase 1 starts on 57.

Source: <https://expo.dev/changelog>. Verified 2026-09-21.

### 2.3 SDK 54 end-of-life — partially unverified

PLAN.md §4 states SDK 54 is at end of life. **Expo publishes no SDK support-window or EOL policy on either <https://expo.dev/changelog> or <https://docs.expo.dev/versions/latest/>**, so that specific claim could not be confirmed against an official source. It does not affect the pin: SDK 57 is the current stable release and is three majors ahead of 54, which satisfies PLAN.md §4 either way.

### 2.4 SDK 57 upgrade risk is low

Expo states React Native 0.86 "is intended to have no breaking changes from 0.85". Two regressions were introduced and then fixed within the 57 line: a Hermes V1 memory regression (fixed in 57.0.9) and increased dev startup time (fixed in 57.0.17). Both are below our pin of 57.0.24.

Source: <https://expo.dev/changelog/sdk-57>. Verified 2026-09-21.

### 2.5 PocketBase v0.40.0 carries a breaking change

> "Propagate console command errors and recovered panics to `app.Start()` so that the program can exit with non-zero code while still ensuring that `app.OnTerminate` hook was triggered."

The changelog notes this breaks shell chaining: `./pocketbase invalid && someothercommand` no longer runs `someothercommand`. This affects `infra/` scripts — any script chaining PocketBase commands with `&&` must be written against the new behaviour.

Also in the 0.40 line: Go 1.27 retrofitted `encoding/json` onto the v2 package and is not fully backward compatible; PocketBase shipped fixes for the resulting regressions in v0.40.1. v0.40.4 fixed a migration deadlock and soft-deprecated `app.ResetBootstrapState()` in favour of `app.ClearBootstrap()` — use `ClearBootstrap()` in new code.

Source: <https://github.com/pocketbase/pocketbase/blob/master/CHANGELOG.md>. Verified 2026-09-21.

### 2.6 SQLCipher support — both drivers have it

This is input to OPEN #1 (PLAN.md §9), not a decision. **Neither driver is chosen here.**

**expo-sqlite 57.0.3** — supported on Android, iOS and macOS. Not supported on Expo Go, so a development build is required. Enable with the `useSQLCipher` config option in `app.json`, then `npx expo prebuild`. Key the database immediately after opening it:

```ts
const db = await SQLite.openDatabaseAsync('databaseName');
await db.execAsync(`PRAGMA key = 'password'`);
```

Source: <https://docs.expo.dev/versions/latest/sdk/sqlite/>. Verified 2026-09-21.

**op-sqlite 18.2.5** — SQLCipher is offered as one of several compilation targets (alongside vanilla SQLite, Turso and libsql), selected at build time. Exact configuration is in the vendor docs at <https://op-engineering.github.io/op-sqlite/>; it was not captured here and must be read before any implementation work.

Source: <https://github.com/OP-Engineering/op-sqlite>. Verified 2026-09-21.

Consequence for both: SQLCipher requires a native build. Expo Go cannot be used for any work touching the local database, from Phase 1 onward.

### 2.7 Drizzle is still pre-1.0

`drizzle-orm` stable is 0.45.3. A v1.0.0 line exists but has not left release candidate — `v1.0.0-rc.4` dates from 2026-06-27, with no stable v1 since. Pin 0.45.3 and treat a v1 migration as future work.

Source: <https://github.com/drizzle-team/drizzle-orm/releases>. Verified 2026-09-21.

### 2.8 victory-native 42 pulls a Skia peer chain

`victory-native@42.0.1` declares peers `@shopify/react-native-skia >=2.6.0 <3.0.0`, `react-native-reanimated >=3.19.1` and `react-native-gesture-handler >=2.0.0`. Skia 2.12.0 satisfies the range; Skia 3.x will not. All three are additional native dependencies and reinforce §2.6: no Expo Go.

Source: `victory-native@42.0.1` package metadata. Verified 2026-09-21.

### 2.9 pnpm — two active lines

npm's `latest` tag is **12.5.1** (2026-09-18). A v11 maintenance release, v11.27.1, was published later (2026-09-20); it is a backport to the older line, not a newer release. Pin 12.5.1 and set it in `packageManager` in the root `package.json`.

Source: <https://github.com/pnpm/pnpm/releases>, <https://registry.npmjs.org/pnpm/latest>. Verified 2026-09-21.

### 2.10 Vitest 5 is stable

Vitest 5.0.0 shipped 2026-09-03; 5.0.1 on 2026-09-15. The 4.x line's last release is 4.1.11 (2026-08-18). Pin 5.0.1.

Source: <https://github.com/vitest-dev/vitest/releases>. Verified 2026-09-21.

---

## 3. Licence audit

CLAUDE.md §3 and PLAN.md §4 forbid GPL/AGPL, and LGPL linked into the app binary, without Stavros's approval. Every dependency pinned above was checked.

| Package | Licence | Verdict |
|---|---|---|
| expo, react-native, expo-router, expo-sqlite, expo-secure-store | MIT | OK |
| @op-engineering/op-sqlite | MIT | OK |
| victory-native, @shopify/react-native-skia, react-native-svg, react-native-reanimated, react-native-gesture-handler | MIT | OK |
| react-native-purchases | MIT | OK |
| vitest, pnpm | MIT | OK |
| drizzle-orm, drizzle-kit | Apache-2.0 | OK — permissive, patent grant, no copyleft |
| PocketBase | MIT | OK |

**No copyleft dependency is present.** Nothing in §1 requires Stavros's approval on licence grounds.

One caveat: SQLCipher's own licence is not covered by the npm metadata of either driver. SQLCipher's community edition is BSD-style, but this was **not verified from an official source** and must be confirmed before OPEN #1 is decided, because it ships inside the app binary.

---

## 4. OPEN items raised by this verification

Recorded, not decided (CLAUDE.md §9).

| # | Item | Recommendation | Reason |
|---|---|---|---|
| V1 | PLAN.md §9 OPEN #1 — expo-sqlite vs op-sqlite | None offered; both confirmed to support SQLCipher | The decision is Stavros's. §2.6 supplies the evidence for both. |
| V2 | SQLCipher's own licence, as shipped inside the binary | Verify against the SQLCipher project before deciding OPEN #1 | Not covered by either driver's npm licence field, and it is linked into a proprietary binary. |
| V3 | Expo SDK 58 (beta, 2026-09-15) | Stay on 57 for Phase 1 | Betas do not go into a product with a paying anchor gym. Revisit when 58 is stable. |
| V4 | Drizzle v1.0.0 (stuck at rc.4 since 2026-06-27) | Pin 0.45.3; revisit at Phase 2 | A pre-1.0 ORM under a stalled v1 is a migration risk worth tracking. |
| V5 | Expo's SDK support window | Ask Expo, or treat "current stable minus 2" as the floor | No official EOL policy is published (§2.3), so PLAN.md §4's SDK 54 EOL claim has no verifiable source. |
