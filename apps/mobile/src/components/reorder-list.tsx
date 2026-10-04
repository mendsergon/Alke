import { useCallback, useRef, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/** How long a press has to rest on an item before it lifts. */
const LIFT_AFTER_MS = 300;
/** How long the other items take to make room, and the lifted one to settle. */
const SHIFT_MS = 160;
/** How much a lifted item grows, so it reads as picked up. */
const LIFTED_SCALE = 1.03;

/**
 * A column whose items are put in a new order by pressing one until it lifts,
 * then dragging it over the others (Stavros, 4 October 2026). While it moves,
 * the others slide out of its way; dropped, it settles into its slot and
 * `onReorder` is told where it went. A short press and a scroll are left to
 * the items and the scroll view: the drag only starts once the press rests.
 */
export function ReorderList<T>({
  items,
  keyOf,
  renderItem,
  onReorder,
  gap,
}: {
  items: readonly T[];
  keyOf: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  onReorder: (from: number, to: number) => void;
  gap: number;
}) {
  // Where each item sits and how tall it is, in list order, read off layout.
  const tops = useSharedValue<number[]>([]);
  const heights = useSharedValue<number[]>([]);
  const measuredHeights = useRef<number[]>([]);
  const measuredTops = useRef<number[]>([]);
  const active = useSharedValue(-1);
  const target = useSharedValue(-1);
  const dragY = useSharedValue(0);

  const onLayout = useCallback(
    (index: number) => (e: LayoutChangeEvent) => {
      measuredHeights.current[index] = e.nativeEvent.layout.height;
      measuredTops.current[index] = e.nativeEvent.layout.y;
      heights.value = measuredHeights.current.slice(0, items.length);
      tops.value = measuredTops.current.slice(0, items.length);
    },
    [heights, tops, items.length],
  );

  // The new order is drawn first; only then does the lifted item let go of
  // its offset, so nothing jumps back to where it started for a frame.
  const drop = useCallback(
    (from: number, to: number) => {
      if (from !== to) onReorder(from, to);
      requestAnimationFrame(() => {
        active.value = -1;
        target.value = -1;
        dragY.value = 0;
      });
    },
    [onReorder, active, target, dragY],
  );

  return (
    <View style={{ gap }}>
      {items.map((item, index) => (
        <Row
          key={keyOf(item)}
          index={index}
          gap={gap}
          active={active}
          target={target}
          dragY={dragY}
          tops={tops}
          heights={heights}
          onLayout={onLayout(index)}
          onDrop={drop}
        >
          {renderItem(item, index)}
        </Row>
      ))}
    </View>
  );
}

function Row({
  index,
  gap,
  active,
  target,
  dragY,
  tops,
  heights,
  onLayout,
  onDrop,
  children,
}: {
  index: number;
  gap: number;
  active: SharedValue<number>;
  target: SharedValue<number>;
  dragY: SharedValue<number>;
  tops: SharedValue<number[]>;
  heights: SharedValue<number[]>;
  onLayout: (e: LayoutChangeEvent) => void;
  onDrop: (from: number, to: number) => void;
  children: ReactNode;
}) {
  const pan = Gesture.Pan()
    .activateAfterLongPress(LIFT_AFTER_MS)
    .onStart(() => {
      active.value = index;
      target.value = index;
      dragY.value = 0;
    })
    .onUpdate((e) => {
      dragY.value = e.translationY;
      // The slot under the lifted item's middle is where it would land.
      const t = tops.value;
      const h = heights.value;
      const middle = (t[index] ?? 0) + (h[index] ?? 0) / 2 + e.translationY;
      let to = index;
      for (let i = 0; i < t.length; i++) {
        if (middle >= (t[i] ?? 0) && middle < (t[i] ?? 0) + (h[i] ?? 0) + gap) to = i;
      }
      const last = t.length - 1;
      if (middle < (t[0] ?? 0)) to = 0;
      else if (last >= 0 && middle >= (t[last] ?? 0) + (h[last] ?? 0)) to = last;
      target.value = to;
    })
    .onEnd(() => {
      const from = active.value;
      const to = target.value;
      // Settle exactly into the slot it lands in, then hand the order over.
      const t = tops.value;
      const h = heights.value;
      const settle = to === from ? 0 : (t[to] ?? 0) - (t[from] ?? 0) + (to > from ? (h[to] ?? 0) - (h[from] ?? 0) : 0);
      dragY.value = withTiming(settle, { duration: SHIFT_MS }, (finished) => {
        if (finished) scheduleOnRN(onDrop, from, to);
      });
    })
    .onFinalize((_, success) => {
      // A press that never lifted, or a lift cancelled by the system.
      if (success) return;
      active.value = -1;
      target.value = -1;
      dragY.value = 0;
    });

  const style = useAnimatedStyle(() => {
    const a = active.value;
    if (a < 0) return { zIndex: 0, transform: [{ translateY: 0 }, { scale: 1 }] };
    if (a === index) {
      return { zIndex: 1, transform: [{ translateY: dragY.value }, { scale: withTiming(LIFTED_SCALE, { duration: SHIFT_MS }) }] };
    }
    // The others make room for the lifted item where it would land.
    const room = (heights.value[a] ?? 0) + gap;
    const to = target.value;
    let shift = 0;
    if (a < index && index <= to) shift = -room;
    else if (a > index && index >= to) shift = room;
    return { zIndex: 0, transform: [{ translateY: withTiming(shift, { duration: SHIFT_MS }) }, { scale: 1 }] };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View onLayout={onLayout} style={style}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
