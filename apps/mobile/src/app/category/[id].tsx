import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Stack, useLocalSearchParams, useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useBack } from '../../navigation/use-back';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/surfaces';
import { ProgramCard } from '../../components/program-card';
import { SearchBar } from '../../components/search-bar';
import { ExerciseIcon } from '../../figure/figure';
import { Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useAuth } from '../../auth/auth';
import { cachedExercisesIn, listExercisesIn, type Exercise } from '../../backend/exercises';
import backIcon from '../../../assets/images/back.png';
import viewListIcon from '../../../assets/images/view-list.png';
import viewGridIcon from '../../../assets/images/view-grid.png';

/**
 * A muscle category's exercises: every exercise whose main muscle it is, as
 * PocketBase holds them. Each is its own card, as programs are — the icon
 * drawn the way Progress draws the body, and the name.
 *
 * OPEN: there is no exercise screen yet, so a card opens nothing.
 */
// The back, list and grid icons (components/icon.tsx), as images for the
// native bar buttons.
const VIEW_ICON = { list: viewListIcon, grid: viewGridIcon };

type View_ = 'list' | 'grid';

// How long a switch takes, about UIKit's own animated scroll.
const MORPH_MS = 300;

/** Where every card sits in each view; all cards in a view are one size. */
type Geometry = { content: number; card: number; listStep: number; gridStep: number };

function frameIn(v: View_, g: Geometry, i: number) {
  'worklet';
  return v === 'list'
    ? { x: 0, y: i * g.listStep, w: g.content, h: g.listStep - tokens.space[12] }
    : {
        x: (i % 2) * (g.card + tokens.space[12]),
        y: Math.floor(i / 2) * g.gridStep,
        w: g.card,
        h: g.gridStep - tokens.space[12],
      };
}

export default function CategoryScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const back = useBack('/explore');
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  // Explore fetches every category's list before one is opened, so the list is
  // normally here in the first frame.
  const [exercises, setExercises] = useState<Exercise[] | null>(() => cachedExercisesIn(id) ?? null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View_>('list');
  const { width } = useWindowDimensions();
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () => exercises?.filter((e) => e.name.toLowerCase().includes(q)) ?? [],
    [exercises, q],
  );

  const content = width - 2 * tokens.space[24];
  // Two columns across the content width; the icon fills its card inside the
  // card's padding and 1px border.
  const card = (content - tokens.space[12]) / 2;
  const tile = card - 2 * tokens.space[12] - 2;
  // Every card in a view is the same size, so where any exercise sits is known
  // without measuring: a list row is the card's border and padding around the
  // icon (taller than two lines of name); a grid card is the tile over the
  // name's two lines and the type.
  const step = {
    list: 2 + 2 * tokens.space[16] + tokens.iconTile.size.sessionHeader + tokens.space[12],
    grid:
      2 + 2 * tokens.space[12] + tile + tokens.space[12] + 2 * tokens.type.rowTitle.lineHeight +
      tokens.space[4] + tokens.type.captionTight.lineHeight + tokens.space[12],
  };
  const perRow = { list: 1, grid: 2 };
  // Kept the same object while the sizes are the same, so the card lists,
  // which are memoised on it, do not redraw on a switch.
  const g = useMemo<Geometry>(
    () => ({ content, card, listStep: step.list, gridStep: step.grid }),
    [content, card, step.list, step.grid],
  );
  const padTop = insets.top + tokens.sizing.tapTarget.ios + tokens.space[16];
  // The title and search, measured; the cards start under them.
  const [headerLength, setHeaderLength] = useState(0);
  const cardsTop = padTop + headerLength;

  // Both views are kept drawn, the one not shown faded out, so a switch
  // builds nothing. The second is drawn once the screen has finished sliding
  // in, so opening the screen never waits on it.
  const [both, setBoth] = useState(false);
  useEffect(
    () =>
      navigation.addListener('transitionEnd', (e) => {
        if (!e.data.closing) setBoth(true);
      }),
    [navigation],
  );

  // 0 is the list, 1 the grid. On a switch every card travels from its place
  // in one view to its place in the other, carried by transforms alone, so
  // nothing is laid out again while it moves; the two views' contents
  // cross-fade on top of that.
  const progress = useSharedValue(0);
  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6], [1, 0], 'clamp'),
  }));
  const gridStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 1], [0, 1], 'clamp'),
  }));

  // While the cards travel, the page scrolls with the exercise that was at the
  // top of the screen, so it stays exactly where it was.
  const scroller = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollOffset(scroller);
  const following = useSharedValue(false);
  const anchorList = useSharedValue(0);
  const anchorGrid = useSharedValue(0);
  const anchorOnScreen = useSharedValue(0);
  useAnimatedReaction(
    () => progress.value,
    (p) => {
      if (!following.value) return;
      const y = anchorList.value + (anchorGrid.value - anchorList.value) * p - anchorOnScreen.value;
      scrollTo(scroller, 0, Math.max(0, y), false);
    },
  );
  const anchor = useRef(0);
  // Which view sets the page's height: the one shown, once it has fully
  // arrived. While switching, the page keeps the taller of the two, so the
  // move to the other view's place is never cut short by the page's end.
  const [showing, setShowing] = useState<View_>('list');
  const [switching, setSwitching] = useState(false);
  const tallest = Math.max(
    shown.length * step.list - tokens.space[12],
    Math.ceil(shown.length / 2) * step.grid - tokens.space[12],
  );

  const switchView = (next: View_) => {
    if (next === view) return;
    const under = scrollY.value + insets.top + tokens.sizing.tapTarget.ios - cardsTop;
    if (headerLength > 0 && under > 0 && shown.length > 0) {
      const row = Math.min(Math.floor(under / step[view]), Math.ceil(shown.length / perRow[view]) - 1);
      // A grid row holds two, so coming back to the list returns to the one it
      // left from when that one is still in the row.
      const n = perRow[view];
      anchor.current = anchor.current >= row * n && anchor.current < (row + 1) * n ? anchor.current : row * n;
      anchorList.value = cardsTop + frameIn('list', g, anchor.current).y;
      anchorGrid.value = cardsTop + frameIn('grid', g, anchor.current).y;
      anchorOnScreen.value = cardsTop + frameIn(view, g, anchor.current).y - scrollY.value;
      following.value = true;
    }
    // The view in the page's flow changes once the move has finished.
    setSwitching(true);
    progress.value = withTiming(
      next === 'grid' ? 1 : 0,
      { duration: MORPH_MS, easing: Easing.out(Easing.cubic) },
      () => {
        following.value = false;
        scheduleOnRN(setShowing, next);
        scheduleOnRN(setSwitching, false);
      },
    );
    setView(next);
  };

  useEffect(() => {
    let live = true;
    void listExercisesIn(id, token).then((items) => {
      if (!live) return;
      // The list Explore fetched is normally this one; replacing it with an
      // equal copy would redraw every card while the screen slides in.
      setExercises((prev) => (items === null ? (prev ?? []) : prev !== null && same(prev, items) ? prev : items));
    });
    return () => {
      live = false;
    };
  }, [id, token]);

  const layer = (v: View_) =>
    v === showing ? {} : { position: 'absolute' as const, top: 0, left: 0, right: 0 };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Animated.ScrollView
        ref={scroller}
        style={{ flexGrow: 1 }}
        contentContainerStyle={{
          // Clears the native bar's buttons, which sit in the 44pt under the
          // status bar.
          paddingTop: padTop,
          paddingHorizontal: tokens.space[24],
          paddingBottom: Math.max(tokens.space[24], insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{ gap: tokens.space[16], paddingBottom: tokens.space[16] }}
          onLayout={(e) => setHeaderLength(e.nativeEvent.layout.height)}
        >
          <Txt variant="screenTitle" family="serif" weight={500}>
            {name ?? ''}
          </Txt>
          {/* Laid out from the first frame, so the list arriving pushes nothing. */}
          {exercises === null || exercises.length > 0 ? (
            <SearchBar value={query} onChange={setQuery} label="Search exercises" />
          ) : null}
        </View>

        {exercises === null ? null : shown.length === 0 ? (
          <EmptyState line={exercises.length === 0 ? 'No exercises yet.' : 'No exercises match.'} />
        ) : (
          <View style={switching ? { minHeight: tallest } : undefined}>
            {view === 'list' || showing === 'list' || both ? (
              <Animated.View
                pointerEvents={view === 'list' ? 'auto' : 'none'}
                style={[{ gap: tokens.space[12] }, layer('list'), listStyle]}
              >
                <ListRows exercises={shown} g={g} progress={progress} />
              </Animated.View>
            ) : null}
            {view === 'grid' || showing === 'grid' || both ? (
              <Animated.View
                pointerEvents={view === 'grid' ? 'auto' : 'none'}
                style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space[12] }, layer('grid'), gridStyle]}
              >
                <GridCards exercises={shown} g={g} tile={tile} progress={progress} />
              </Animated.View>
            ) : null}
          </View>
        )}
      </Animated.ScrollView>

      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon={backIcon}
          iconRenderingMode="template"
          tintColor={c.text}
          accessibilityLabel="Back"
          onPress={back}
        />
      </Stack.Toolbar>
      {exercises !== null && exercises.length > 0 ? (
        // A native bar button: on iOS 26 its menu opens out of the glass.
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Menu
            icon={VIEW_ICON[view]}
            iconRenderingMode="template"
            tintColor={c.text}
            accessibilityLabel="View"
          >
            <Stack.Toolbar.MenuAction
              icon={VIEW_ICON.list}
              iconRenderingMode="template"
              isOn={view === 'list'}
              onPress={() => switchView('list')}
            >
              List
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction
              icon={VIEW_ICON.grid}
              iconRenderingMode="template"
              isOn={view === 'grid'}
              onPress={() => switchView('grid')}
            >
              Grid
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar>
      ) : null}
    </View>
  );
}

/**
 * One card carried between views: from its place in the list to its place in
 * the grid, by translation and scale only. The same exercise's card in the
 * other view is carried along the same path, so the two travel as one.
 */
function Travel({
  as,
  index,
  g,
  progress,
  children,
}: {
  as: View_;
  index: number;
  g: Geometry;
  progress: SharedValue<number>;
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const a = frameIn('list', g, index);
    const b = frameIn('grid', g, index);
    const own = as === 'list' ? a : b;
    const x = a.x + (b.x - a.x) * p;
    const y = a.y + (b.y - a.y) * p;
    const w = a.w + (b.w - a.w) * p;
    const h = a.h + (b.h - a.h) * p;
    return {
      transform: [
        { translateX: x + w / 2 - (own.x + own.w / 2) },
        { translateY: y + h / 2 - (own.y + own.h / 2) },
        { scaleX: w / own.w },
        { scaleY: h / own.h },
      ],
    };
  });
  return <Animated.View style={[{ width: as === 'list' ? g.content : g.card }, style]}>{children}</Animated.View>;
}

// The rows and cards redraw only when the exercises shown change, never on a
// switch.
const ListRows = memo(function ListRows({
  exercises,
  g,
  progress,
}: {
  exercises: readonly Exercise[];
  g: Geometry;
  progress: SharedValue<number>;
}) {
  const { c } = useTheme();
  return exercises.map((e, i) => (
    <Travel key={e.id} as="list" index={i} g={g} progress={progress}>
      <ProgramCard label={e.name} padding={tokens.space[16]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[16] }}>
          <ExerciseIcon icon={e.icon} size={tokens.iconTile.size.sessionHeader} seamAll />
          <Txt variant="serifListTitle" family="serif" weight={500} color={c.text} style={{ flexShrink: 1 }}>
            {e.name}
          </Txt>
        </View>
      </ProgramCard>
    </Travel>
  ));
});

// A card on the page with the raised icon tile inside it (design page 29,
// surfaces), then the name held to two lines and the type, as the exercise set
// on page 31 labels them. Every card is the same height, so the rows line up.
const GridCards = memo(function GridCards({
  exercises,
  g,
  tile,
  progress,
}: {
  exercises: readonly Exercise[];
  g: Geometry;
  tile: number;
  progress: SharedValue<number>;
}) {
  const { c } = useTheme();
  return exercises.map((e, i) => (
    <Travel key={e.id} as="grid" index={i} g={g} progress={progress}>
      <ProgramCard label={e.name} padding={tokens.space[12]}>
        <View style={{ gap: tokens.space[12] }}>
          <ExerciseIcon icon={e.icon} size={tile} seamAll />
          <View style={{ gap: tokens.space[4] }}>
            <Txt
              variant="rowTitle"
              color={c.text}
              numberOfLines={2}
              style={{ minHeight: 2 * tokens.type.rowTitle.lineHeight }}
            >
              {e.name}
            </Txt>
            <Txt variant="captionTight" color={c.textSecondary} numberOfLines={1}>
              {e.type}
            </Txt>
          </View>
        </View>
      </ProgramCard>
    </Travel>
  ));
});

function same(a: readonly Exercise[], b: readonly Exercise[]) {
  return (
    a.length === b.length &&
    a.every((e, i) => e.id === b[i].id && e.name === b[i].name && e.icon === b[i].icon && e.type === b[i].type)
  );
}
