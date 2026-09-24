/** Metro resolves font files to an asset module id; TypeScript needs telling. */
declare module '*.ttf' {
  const asset: number;
  export default asset;
}

/** Images resolve the same way. */
declare module '*.png' {
  const asset: number;
  export default asset;
}
