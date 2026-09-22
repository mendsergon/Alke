import { createContext, useContext, type ReactNode } from 'react';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Arrival is the app's own entrance, and it is a separate thing from the gate
 * leaving.
 *
 * The gate de-materializing is only half a transition. If the screen behind it
 * is already finished and merely uncovered, the app reads as having launched
 * while you were not looking. So the screen behind the glass is held suspended
 * — held back and dim, which through the blur is exactly the soft field of
 * light a material needs to refract — and it comes forward as the glass
 * releases.
 *
 * One value carries it. Each block on the screen reads its own window out of
 * that single 0 → 1 progress, which is what produces the stagger: no timers, no
 * per-item animations to keep in step, and the whole thing stays on the UI
 * thread and reverses cleanly if it is interrupted.
 *
 *   0 = suspended behind the glass.
 *   1 = arrived.
 */
const Ctx = createContext<SharedValue<number> | null>(null);

export function ArrivalProvider({
  progress,
  children,
}: {
  progress: SharedValue<number>;
  children: ReactNode;
}) {
  return <Ctx.Provider value={progress}>{children}</Ctx.Provider>;
}

/**
 * Screens outside the gate — a session opened from Home, say — have nothing to
 * arrive from, so they get a value that is already at rest rather than a throw.
 */
export function useArrival(): SharedValue<number> {
  const fromGate = useContext(Ctx);
  const standalone = useSharedValue(1);
  return fromGate ?? standalone;
}

/** How much of the progress one block takes to travel, out of the whole. */
export const ARRIVAL_SPAN = 0.55;
/** How far apart consecutive blocks start. The overlap is what makes it flow. */
export const ARRIVAL_STAGGER = 0.09;
/**
 * How small a block is while it is suspended. It arrives by coming forward,
 * not by sliding up: a few pixels of vertical travel is displacement, and
 * displacement is not the same thing as something resolving into being. Scale
 * is depth, and depth is what an arrival actually is.
 */
export const ARRIVAL_ZOOM = 0.94;
/** How dim it is there. Never 0 — the glass needs something to refract. */
export const ARRIVAL_DIM = 0.45;

/**
 * One block's share of the arrival. It reads its own window out of the single
 * shared progress, so the stagger costs nothing, stays on the UI thread and
 * reverses for free.
 */
export function Arriving({ index, children }: { index: number; children: ReactNode }) {
  const arrival = useArrival();
  const start = index * ARRIVAL_STAGGER;
  const style = useAnimatedStyle(() => {
    const t = interpolate(
      arrival.get(),
      [start, start + ARRIVAL_SPAN],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: interpolate(t, [0, 1], [ARRIVAL_DIM, 1]),
      transform: [{ scale: interpolate(t, [0, 1], [ARRIVAL_ZOOM, 1]) }],
    };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}
