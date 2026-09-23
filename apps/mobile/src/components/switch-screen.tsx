import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens, useTheme } from '../theme/theme';
import { Arriving } from './arrival';
import { flatten } from './screen';

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
 */
export function SwitchScreen({
  header,
  pages,
  index,
  onIndexChange,
  gap = tokens.space[16],
  headerGap = gap,
}: {
  header: ReactNode;
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
  const pager = useRef<ScrollView>(null);
  // The index the pager was last sent to or last settled on, so a swipe that
  // moved the switch does not send the pager a second, redundant scroll.
  const shown = useRef(index);

  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    pager.current?.scrollTo({ x: index * width, animated: true });
  }, [index, width]);

  const headerBlocks = flatten(header);

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
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
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
      </ScrollView>
    </View>
  );
}
