/**
 * The body map's heat ramp. The theme gives five accent-hued stops, weakest
 * to strongest; a score picks a point on the line through them. Scores past
 * the outer stops keep travelling along the end segment, which is how the
 * design export reaches past its own legend.
 */
function toRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0').toUpperCase()).join('')}`;
}

export function heatColor(stops: readonly string[], score: number): string {
  const last = stops.length - 1;
  const x = score * last;
  const i = Math.max(0, Math.min(last - 1, Math.floor(x)));
  const t = x - i;
  const a = toRgb(stops[i]);
  const b = toRgb(stops[i + 1]);
  return toHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}

/** Blend two hex colours. `t` of 0 is all `a`, 1 is all `b`. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}
