// Alke's orb: two of the nine thinking-orb states, and the passage between
// them.
//
// `composing` is what the orb does while it is idle or talking — an
// undulating sash of 566 dots around a sphere. `shaping` is what it does
// while it thinks — a flat outline of 24 dots morphing between figures.
//
// Those two are not neighbours. Going from one to the other by fading one
// out and the other in would throw 566 dots away and conjure 24 from
// nowhere, which is a cut dressed up as a transition. So the dots are not
// thrown away: every dot on the sash is paired with a point on the outline
// and travels there. The sash gathers itself into the figure, and the
// surplus — 542 dots the outline has no room for — thins out on the way in
// rather than vanishing where it stands. Reversed, the figure opens back
// out into the sash.
//
// Geometry for both ends comes from `thinking-orbs/engine`, the same
// compiled frame maths the web component runs. Only the passage between
// them is ours.

import { useEffect, useMemo, useRef, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Canvas, Picture, Skia, createPicture } from '@shopify/react-native-skia';
import type { SkPicture } from '@shopify/react-native-skia';
import { MODE_FRAMES, resolvePreset } from 'thinking-orbs/engine';
import type { Dot } from 'thinking-orbs/engine';
import { useTheme } from '../theme/theme';

/** What the orb is doing, in Alke's words rather than the library's. */
export type OrbMood = 'idle' | 'thinking';

const MOOD_STATE = { idle: 'composing', thinking: 'shaping' } as const;

/**
 * OPEN: PLAN.md §3 defines no motion tokens, so this is a choice in code.
 * The passage is on-screen movement with no finger on it, so it takes an
 * ease-in-out rather than a spring, and it sits in the "occasional" tier —
 * long enough to read as travel, short enough not to delay the thought.
 */
const MORPH_MS = 560;

/** Ease-in-out: slow, fast, slow. For something already on screen moving A → B. */
function ease(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

/**
 * Dots are paired by where they sit around the centre, not by their index.
 * Index order is draw order — depth — so pairing on it would send dots
 * across each other on their way. Angular order sends each dot to the
 * nearest part of the figure, and the cloud turns in on itself instead of
 * scrambling.
 */
function byAngle(dots: readonly Dot[], c: number): Dot[] {
  return [...dots].sort((p, q) => Math.atan2(p.y - c, p.x - c) - Math.atan2(q.y - c, q.x - c));
}

/**
 * The instant a still orb is frozen at. Picked by rendering eight candidates
 * on the button itself and reading the pixels: here the sash has wound all
 * the way round, so at 20px the mark is an even, complete form rather than a
 * lopsided band with a gap in one side.
 */
const STILL_T = 3.0;

export function Orb({
  mood = 'idle',
  size = 64,
  detail,
  speed = 1,
  still = false,
  flat = false,
  ink,
  style,
}: {
  mood?: OrbMood;
  /** The box the orb is drawn into, in dp. */
  size?: number;
  /**
   * Which of the library's two tunings to draw, independently of the box.
   * 20 is its own design for inline scale — sparse and chunky — not the 64
   * shrunk. Drawing the 64 tuning into a small box keeps the sash's real
   * character at the cost of finer dots. Defaults to whichever tuning matches
   * the box.
   */
  detail?: 64 | 20;
  speed?: number;
  /** Freeze on one frame and run no loop at all. */
  still?: boolean;
  /**
   * Drop the depth. The orb's dots carry z in their alpha and their radius,
   * which is what makes the animated orb read as a wound band in space. A
   * mark sitting in a button is not an object in space — it is a symbol, and
   * the same shading there just reads as a smudge. Flat draws every dot at
   * one opacity and one radius: the same figure, in two dimensions.
   */
  flat?: boolean;
  /**
   * Draw the dots in this colour instead of the theme's ink, keeping each
   * dot's depth in its alpha. For an orb sitting on a filled surface, where
   * grey-on-accent would read as dirt rather than as depth.
   */
  ink?: string;
  style?: ViewStyle;
}) {
  const { scheme } = useTheme();
  const dark = scheme === 'dark';
  const [picture, setPicture] = useState<SkPicture | null>(null);

  // One paint, mutated in place. A fresh SkPaint per dot would allocate
  // hundreds of native objects a frame.
  const paint = useMemo(() => Skia.Paint(), []);
  const rgba = useRef(new Float32Array(4)).current;

  const tuning: 64 | 20 = detail ?? (size <= 32 ? 20 : 64);
  // Geometry is built at the tuning's own size and scaled into the box, so a
  // 64 tuning can sit in a 20dp mark without its proportions changing.
  const scale = size / tuning;
  const idle = useMemo(() => resolvePreset(MOOD_STATE.idle, tuning), [tuning]);
  const thinking = useMemo(() => resolvePreset(MOOD_STATE.thinking, tuning), [tuning]);

  // Where the passage is: 0 = fully idle, 1 = fully thinking. It is read and
  // written by the frame loop, so it is a ref, not state — one React render
  // per frame is what makes this kind of thing stutter.
  const travel = useRef(mood === 'thinking' ? 1 : 0);
  const from = useRef(travel.current);
  const startedAt = useRef<number | null>(null);
  const target = mood === 'thinking' ? 1 : 0;

  useEffect(() => {
    // Leave from wherever the orb actually is. A passage interrupted halfway
    // turns round from halfway; it does not snap to an end first.
    from.current = travel.current;
    startedAt.current = Date.now();
  }, [target]);

  useEffect(() => {
    paint.setAntiAlias(true);

    const tint = ink ? Skia.Color(ink) : null;
    const setInk = (white: number, alpha: number) => {
      const w = Math.min(1, Math.max(0, white));
      if (tint) {
        // A tinted orb keeps its depth in alpha: on a filled surface a grey
        // dot reads as dirt, where a faint one reads as far away.
        rgba[0] = tint[0];
        rgba[1] = tint[1];
        rgba[2] = tint[2];
        rgba[3] = flat
          ? alpha
          : // Near dots (low ink value) go opaque, far ones stay faint, with a
            // floor so the mark does not read as lighter than its label.
            Math.min(1, alpha * (0.35 + 0.65 * (1 - w)) * 2.1);
      } else {
        // Quantised to 8-bit exactly as the canvas painter does, so this
        // lands on the same greys as the web rather than merely near them.
        const g = Math.round((dark ? 1 - w : w) * 255) / 255;
        rgba[0] = g;
        rgba[1] = g;
        rgba[2] = g;
        rgba[3] = alpha;
      }
      paint.setColor(rgba);
    };

    const c = tuning / 2;
    const buildIdle = MODE_FRAMES[idle.mode];
    const buildThinking = MODE_FRAMES[thinking.mode];

    const record = () => {
      const now = Date.now();
      if (startedAt.current !== null) {
        const raw = Math.min(1, (now - startedAt.current) / MORPH_MS);
        travel.current = lerp(from.current, target, ease(raw));
        if (raw >= 1) startedAt.current = null;
      }
      const p = travel.current;
      const seconds = now / 1000;

      // At either end there is nothing to pair: draw that state's own frame
      // and pay none of the morph's cost.
      if (p <= 0 || p >= 1) {
        const preset = p <= 0 ? idle : thinking;
        const build = p <= 0 ? buildIdle : buildThinking;
        const frame = build(tuning, seconds * preset.speed * speed, preset.opts);
        setPicture(
          createPicture((canvas) => {
            if (scale !== 1) canvas.scale(scale, scale);
            for (const d of frame.dots) {
              setInk(d.white, d.a ?? 1);
              canvas.drawCircle(d.x, d.y, d.r, paint);
            }
          }, Skia.XYWHRect(0, 0, size, size)),
        );
        return;
      }

      // Both ends keep running underneath the passage, so the sash is still
      // undulating as it gathers and the figure is already turning as it
      // opens. Freezing either end would make the morph read as a still
      // image being slid into place.
      const a = byAngle(buildIdle(tuning, seconds * idle.speed * speed, idle.opts).dots, c);
      const b = byAngle(buildThinking(tuning, seconds * thinking.speed * speed, thinking.opts).dots, c);
      const n = Math.max(a.length, b.length);
      const big = a.length >= b.length ? a : b;
      const small = a.length >= b.length ? b : a;
      const bigIsIdle = a.length >= b.length;
      // Toward the crowded end, p measured from the crowd's side.
      const q = bigIsIdle ? p : 1 - p;
      const m = small.length;

      const drawn: { x: number; y: number; z: number; r: number; white: number; a: number }[] = [];
      for (let i = 0; i < n; i++) {
        const src = big[i]!;
        const j = Math.round((i * m) / n) % m;
        const dst = small[j]!;
        // Only one dot per point of the figure survives the crossing. The
        // rest still travel — they just thin out as they arrive, so the
        // crowd condenses instead of being deleted.
        const keeps = Math.round((j * n) / m) % n === i;
        const srcA = src.a ?? 1;
        const dstA = keeps ? dst.a ?? 1 : 0;
        drawn.push({
          x: lerp(src.x, dst.x, q),
          y: lerp(src.y, dst.y, q),
          z: lerp(src.z, dst.z, q),
          r: lerp(src.r, dst.r, q),
          white: lerp(src.white, dst.white, q),
          a: lerp(srcA, dstA, q),
        });
      }
      // The engine hands each end already z-sorted; a morphed frame is a new
      // arrangement, so it has to be re-sorted or near dots draw behind far
      // ones halfway across.
      drawn.sort((u, v) => u.z - v.z);

      setPicture(
        createPicture((canvas) => {
            if (scale !== 1) canvas.scale(scale, scale);
          for (const d of drawn) {
            if (d.a <= 0.002) continue;
            setInk(d.white, d.a);
            canvas.drawCircle(d.x, d.y, d.r, paint);
          }
        }, Skia.XYWHRect(0, 0, size, size)),
      );
    };

    // A still orb is a mark, not an animation: one frame, no loop, no clock.
    if (still) {
      const preset = target === 1 ? thinking : idle;
      const build = target === 1 ? buildThinking : buildIdle;
      const frame = build(tuning, STILL_T * preset.speed, preset.opts);
      // One radius for every dot, taken from the frame's own largest, so the
      // figure keeps its scale without keeping its perspective.
      const flatR = flat ? Math.max(...frame.dots.map((d) => d.r)) : 0;
      setPicture(
        createPicture((canvas) => {
          if (scale !== 1) canvas.scale(scale, scale);
          for (const d of frame.dots) {
            if (flat) setInk(0, 1);
            else setInk(d.white, d.a ?? 1);
            canvas.drawCircle(d.x, d.y, flat ? flatR : d.r, paint);
          }
        }, Skia.XYWHRect(0, 0, size, size)),
      );
      return;
    }

    let raf = 0;
    let running = true;
    const loop = () => {
      record();
      if (running) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [idle, thinking, tuning, scale, size, speed, dark, target, still, flat, ink, paint, rgba]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={mood === 'thinking' ? 'Thinking…' : 'Working…'}
      style={[{ width: size, height: size }, style]}
    >
      <Canvas style={{ width: size, height: size }}>
        {picture ? <Picture picture={picture} /> : null}
      </Canvas>
    </View>
  );
}
