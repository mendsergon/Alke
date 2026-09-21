# thinking-orbs-native (vendored)

Source copied from the `thinking-orbs` repository, directory
`ports/react-native/thinking-orbs-native/src`, at the `main` branch.

It is vendored rather than installed because the React Native port is **not
published to npm** — only the web package `thinking-orbs` is. The engine it
draws from comes from that published package (`thinking-orbs/engine`), which
is a real dependency in `apps/mobile/package.json`.

- Upstream: https://github.com/Jakubantalik/thinking-orbs
- Licence: MIT © Jakub Antalik — see LICENSE in this directory.
- Peers it needs, both installed: `@shopify/react-native-skia`,
  `react-native-reanimated`.

**Upstream's own warning, quoted:**

> Status: not yet runtime-verified on a device or simulator. Geometry, types
> and the Skia draw sequence are verified as described below, but nobody has
> watched this render on a phone yet. Do not ship it to users until that
> happens.

Nothing in Alke imports this yet.
