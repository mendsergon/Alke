import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
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
import { Stack, useLocalSearchParams } from 'expo-router';
import { useBack } from '../../navigation/use-back';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/surfaces';
import { ProgramCard } from '../../components/program-card';
import { SearchBar } from '../../components/search-bar';
import { useExerciseIconUri } from '../../figure/figure';
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

// How long the cards take to restack, about UIKit's own animated scroll.
const RESTACK_MS = 300;

/**
 * Where everything sits in each view. Every card in a view is the same size,
 * so all of it is known without measuring: a list row is the card's border
 * and padding around the icon (taller than two lines of name); a grid card is
 * the tile over the name's two lines and the type.
 */
type Geometry = {
  content: number;
  card: number;
  tile: number;
  listRow: number;
  gridRow: number;
};

function listFrame(g: Geometry, i: number) {
  'worklet';
  return { x: 0, y: i * (g.listRow + tokens.space[12]), w: g.content, h: g.listRow };
}

function gridFrame(g: Geometry, i: number) {
  'worklet';
  return {
    x: (i % 2) * (g.card + tokens.space[12]),
    y: Math.floor(i / 2) * (g.gridRow + tokens.space[12]),
    w: g.card,
    h: g.gridRow,
  };
}

export default function CategoryScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const back = useBack('/explore');
  const { token } = useAuth();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  // Explore fetches every category's list before one is opened, so the list is
  // normally here in the first frame.
  const [exercises, setExercises] = useState<Exercise[] | null>(() => cachedExercisesIn(id) ?? null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View_>('list');
  const { width, height } = useWindowDimensions();
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () => exercises?.filter((e) => e.name.toLowerCase().includes(q)) ?? [],
    [exercises, q],
  );

  const g = useMemo<Geometry>(() => {
    const content = width - 2 * tokens.space[24];
    // Two columns across the content width; the icon fills its card inside
    // the card's padding and 1px border.
    const card = (content - tokens.space[12]) / 2;
    const tile = card - 2 * tokens.space[12] - 2;
    return {
      content,
      card,
      tile,
      listRow: 2 + 2 * tokens.space[16] + tokens.iconTile.size.sessionHeader,
      gridRow:
        2 + 2 * tokens.space[12] + tile + tokens.space[12] + 2 * tokens.type.rowTitle.lineHeight +
        tokens.space[4] + tokens.type.captionTight.lineHeight,
    };
  }, [width]);

  const padTop = insets.top + tokens.sizing.tapTarget.ios + tokens.space[16];
  // The title and search, measured; the cards start under them.
  const [headerLength, setHeaderLength] = useState(0);
  const cardsTop = padTop + headerLength;

  // What fits on the screen is drawn before the screen shows; the cards under
  // it are added straight after, out of sight.
  const firstBatch = Math.ceil(height / (g.listRow + tokens.space[12])) * 2 + 2;
  const [all, setAll] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAll(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const drawn = all ? shown : shown.slice(0, firstBatch);

  // 0 is the list, 1 the grid. Every card, icon and label reads its place from
  // this one value, so a switch moves them all together, on the UI thread.
  const progress = useSharedValue(0);
  const count = shown.length;
  const stack = useAnimatedStyle(() => ({
    height: interpolate(
      progress.value,
      [0, 1],
      [
        Math.max(0, count * (g.listRow + tokens.space[12]) - tokens.space[12]),
        Math.max(0, Math.ceil(count / 2) * (g.gridRow + tokens.space[12]) - tokens.space[12]),
      ],
    ),
  }));

  // While the cards restack, the page scrolls with the exercise that was at the
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
      const y = interpolate(p, [0, 1], [anchorList.value, anchorGrid.value]) - anchorOnScreen.value;
      scrollTo(scroller, 0, Math.max(0, y), false);
    },
  );
  const anchor = useRef(0);

  const switchView = (next: View_) => {
    if (next === view) return;
    const frame = view === 'list' ? listFrame : gridFrame;
    const perRow = view === 'list' ? 1 : 2;
    const step = (view === 'list' ? g.listRow : g.gridRow) + tokens.space[12];
    // The first row whose top edge is at or under the bar.
    const under = scrollY.value + insets.top + tokens.sizing.tapTarget.ios - cardsTop;
    if (headerLength > 0 && under > 0 && count > 0) {
      const row = Math.min(Math.floor(under / step), Math.ceil(count / perRow) - 1);
      // A grid row holds two, so coming back to the list returns to the one it
      // left from when that one is still in the row.
      const inRow = anchor.current >= row * perRow && anchor.current < (row + 1) * perRow;
      anchor.current = inRow ? anchor.current : row * perRow;
      anchorList.value = cardsTop + listFrame(g, anchor.current).y;
      anchorGrid.value = cardsTop + gridFrame(g, anchor.current).y;
      anchorOnScreen.value = cardsTop + frame(g, anchor.current).y - scrollY.value;
      following.value = true;
    }
    progress.value = withTiming(
      next === 'grid' ? 1 : 0,
      { duration: RESTACK_MS, easing: Easing.out(Easing.cubic) },
      () => {
        following.value = false;
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
          <Animated.View style={stack}>
            {drawn.map((e, i) => (
              <ExerciseCard key={e.id} exercise={e} index={i} g={g} progress={progress} />
            ))}
          </Animated.View>
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
 * One exercise, the same card in both views, carried from one place to the
 * other. In the list it is a row: the icon beside the name. In the grid it is
 * the card design page 29 puts on a page — the raised icon tile inside it —
 * with the name held to two lines and the type under it, as the exercise set
 * on page 31 labels them. The name is set in each view's own face, so the two
 * labels hand over while the card and its icon move.
 */
function ExerciseCard({
  exercise: e,
  index,
  g,
  progress,
}: {
  exercise: Exercise;
  index: number;
  g: Geometry;
  progress: SharedValue<number>;
}) {
  const { c } = useTheme();
  // Drawn at the grid's size once and shown smaller in the list.
  const uri = useExerciseIconUri(e.icon, g.tile - 4, true);
  const small = tokens.iconTile.size.sessionHeader;

  const frame = useAnimatedStyle(() => {
    const a = listFrame(g, index);
    const b = gridFrame(g, index);
    const p = progress.value;
    return {
      left: interpolate(p, [0, 1], [a.x, b.x]),
      top: interpolate(p, [0, 1], [a.y, b.y]),
      width: interpolate(p, [0, 1], [a.w, b.w]),
    };
  });
  const inner = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [g.listRow - 2, g.gridRow - 2]),
  }));
  const icon = useAnimatedStyle(() => {
    const p = progress.value;
    const size = interpolate(p, [0, 1], [small, g.tile]);
    return {
      left: interpolate(p, [0, 1], [tokens.space[16], tokens.space[12]]),
      top: interpolate(p, [0, 1], [tokens.space[16], tokens.space[12]]),
      width: size,
      height: size,
      borderRadius: interpolate(p, [0, 1], [tokens.iconTile.radius, tokens.iconTile.radiusAbove56]),
    };
  });
  const listLabel = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0], 'clamp'),
  }));
  const gridLabel = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], 'clamp'),
  }));

  return (
    <Animated.View style={[{ position: 'absolute' }, frame]}>
      <ProgramCard label={e.name} padding={0}>
        {/* Clipped to the card, so labels never show outside it mid-move. */}
        <Animated.View style={[{ overflow: 'hidden', borderRadius: tokens.radius.card }, inner]}>
          <Animated.View
            style={[
              { position: 'absolute', padding: 2, backgroundColor: c.surfaceRaised, overflow: 'hidden' },
              icon,
            ]}
          >
            <Image source={{ uri }} style={{ flex: 1 }} />
          </Animated.View>
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: tokens.space[16] + small + tokens.space[16],
                right: tokens.space[16],
                top: 0,
                bottom: 0,
                justifyContent: 'center',
              },
              listLabel,
            ]}
          >
            <Txt variant="serifListTitle" family="serif" weight={500} color={c.text}>
              {e.name}
            </Txt>
          </Animated.View>
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: tokens.space[12],
                right: tokens.space[12],
                top: tokens.space[12] + g.tile + tokens.space[12],
                gap: tokens.space[4],
              },
              gridLabel,
            ]}
          >
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
          </Animated.View>
        </Animated.View>
      </ProgramCard>
    </Animated.View>
  );
}

function same(a: readonly Exercise[], b: readonly Exercise[]) {
  return (
    a.length === b.length &&
    a.every((e, i) => e.id === b[i].id && e.name === b[i].name && e.icon === b[i].icon && e.type === b[i].type)
  );
}
