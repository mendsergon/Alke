import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useDerivedValue,
  useReducedMotion,
  useScrollOffset,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens, useTheme } from '../theme/theme';
import { Arriving } from './arrival';
import { flatten } from './screen';

/** How long the switch's slide takes. */
const SLIDE_MS = 180;

/**
 * A tab screen with two sides, such as Programs and Exercises.
 *
 * The header — title, actions and the switch — stays put. Under it the two
 * sides sit side by side in a native paging scroll view: the switch slides it
 * to the other side, and a sideways swipe does the same and moves the switch.
 * Each side is its own vertical scroll view, so each keeps where it was
 * scrolled to when the other is shown.
 *
 * Padding, gap and the arrival are the ones `Screen` uses.
 *
 * The switch's slide is driven here rather than by `scrollTo({ animated })`,
 * whose duration is UIKit's own (about 0.3s) and cannot be set.
 *
 * The root stack hides its native bar while a two-sided tab is focused
 * (`app/_layout.tsx`): nothing scrolls under it here, and its frame would take
 * the touches meant for the header's controls.
 */
export function SwitchScreen({
  header,
  pages,
  index,
  onIndexChange,
  gap = tokens.space[16],
  headerGap = gap,
}: {
  /** Given the pager's progress, 0 to 1, for a switch that moves with it. */
  header: (progress: SharedValue<number>) => ReactNode;
  pages: readonly [ReactNode, ReactNode];
  index: number;
  onIndexChange: (index: number) => void;
  gap?: number;
  /** Space between the header and the top of each side. */
  headerGap?: number;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const pager = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(pager);
  const target = useSharedValue(index * width);
  const sliding = useSharedValue(false);
  const reduceMotion = useReducedMotion();
  const progress = useDerivedValue(() => (width > 0 ? offset.value / width : 0));
  // The index the pager was last sent to or last settled on, so a swipe that
  // moved the switch does not send the pager a second, redundant scroll.
  const shown = useRef(index);

  // Each frame of the slide moves the pager, on the UI thread.
  useAnimatedReaction(
    () => target.value,
    (x) => {
      if (sliding.value) scrollTo(pager, x, 0, false);
    },
  );

  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    // From wherever the pager is now, which a swipe may have left anywhere.
    target.value = offset.value;
    sliding.value = true;
    target.value = withTiming(
      index * width,
      { duration: reduceMotion ? 0 : SLIDE_MS, easing: Easing.out(Easing.cubic) },
      () => {
        sliding.value = false;
      },
    );
  }, [index, width, offset, target, sliding, reduceMotion]);

  const headerBlocks = flatten(header(progress));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* The space under the header belongs to the header, not to the pages,
          so scrolled content is cut that far below the switch rather than
          running into it. */}
      <View
        style={{
          paddingTop: insets.top + tokens.space[24],
          paddingHorizontal: tokens.space[24],
          paddingBottom: headerGap,
          gap,
        }}
      >
        {headerBlocks.map((block, i) => (
          <Arriving key={i} index={i}>
            {block}
          </Arriving>
        ))}
      </View>
      <Animated.ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled
        onMomentumScrollEnd={(e) => {
          const settled = Math.round(e.nativeEvent.contentOffset.x / width);
          if (settled !== shown.current) {
            shown.current = settled;
            onIndexChange(settled);
          }
        }}
        style={{ flex: 1 }}
      >
        {pages.map((page, p) => (
          <ScrollView
            key={p}
            style={{ width }}
            contentContainerStyle={{
              paddingHorizontal: tokens.space[24],
              paddingBottom: tokens.space[20],
              gap,
            }}
            showsVerticalScrollIndicator={false}
          >
            {flatten(page).map((block, i) => (
              <Arriving key={i} index={headerBlocks.length + i}>
                {block}
              </Arriving>
            ))}
          </ScrollView>
        ))}
      </Animated.ScrollView>
    </View>
  );
}
