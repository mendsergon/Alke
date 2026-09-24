import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions, type ListRenderItem } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
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
  const [view, setView] = useState<'list' | 'grid'>('list');
  const { width, height } = useWindowDimensions();
  // Two columns across the page's content width; the icon fills its card
  // inside the card's padding and 1px border.
  const card = (width - 2 * tokens.space[24] - tokens.space[12]) / 2;
  const tile = card - 2 * tokens.space[12] - 2;
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () => exercises?.filter((e) => e.name.toLowerCase().includes(q)) ?? [],
    [exercises, q],
  );

  const renderRow = useCallback<ListRenderItem<Exercise>>(
    ({ item: e }) => (
      <ProgramCard label={e.name} padding={tokens.space[16]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[16] }}>
          <ExerciseIcon icon={e.icon} size={tokens.iconTile.size.sessionHeader} seamAll />
          <Txt variant="serifListTitle" family="serif" weight={500} color={c.text} style={{ flexShrink: 1 }}>
            {e.name}
          </Txt>
        </View>
      </ProgramCard>
    ),
    [c],
  );
  // A card on the page with the raised icon tile inside it (design page 29,
  // surfaces), then the name held to two lines and the type, as the exercise
  // set on page 31 labels them. Every card is the same height, so rows line up.
  const renderTile = useCallback<ListRenderItem<Exercise>>(
    ({ item: e }) => (
      <View style={{ width: card }}>
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
      </View>
    ),
    [c, card, tile],
  );
  // Every row of a view is the same height, so where any exercise sits is
  // known without drawing it: a list row is the card's border and padding
  // around the icon (taller than two lines of name); a grid row is the tile
  // over the name's two lines and the type.
  const rowLength = (v: 'list' | 'grid') =>
    v === 'list'
      ? 2 + 2 * tokens.space[16] + tokens.iconTile.size.sessionHeader
      : 2 + 2 * tokens.space[12] + tile + tokens.space[12] + 2 * tokens.type.rowTitle.lineHeight +
        tokens.space[4] + tokens.type.captionTight.lineHeight;
  const columns = (v: 'list' | 'grid') => (v === 'list' ? 1 : 2);
  const padTop = insets.top + tokens.sizing.tapTarget.ios + tokens.space[16];
  // The title and search, measured; the rows start under them.
  const [headerLength, setHeaderLength] = useState(0);
  const rowStart = padTop + headerLength;
  const perRow = columns(view);
  const step = rowLength(view) + tokens.space[12];
  // Only what fits on the screen is drawn before the screen shows; the rows
  // under it are filled in straight after, out of sight.
  const firstBatch = (Math.ceil(height / step) + 1) * perRow;
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: rowLength(view), offset: rowStart + index * step, index }),
    [view, rowStart, step],
  );

  // Switching view keeps the exercise at the top of the screen where it was:
  // the new view opens on that exercise's row, at the same height on screen.
  const scrollY = useRef(0);
  const anchor = useRef(0);
  const [startAt, setStartAt] = useState({ row: 0, y: 0 });
  const switchView = (next: 'list' | 'grid') => {
    if (next === view) return;
    const y = scrollY.current;
    // The first row whose top edge is at or under the bar.
    const under = y + insets.top + tokens.sizing.tapTarget.ios - rowStart;
    let target = { row: 0, y };
    if (headerLength > 0 && under > 0) {
      const row = Math.floor(under / step);
      const into = y - (rowStart + row * step);
      // The exercise at the top: a grid row holds two, so coming back to the
      // list returns to the one it left from when that one is still in the row.
      const inRow = anchor.current >= row * perRow && anchor.current < (row + 1) * perRow;
      const first = inRow ? anchor.current : row * perRow;
      anchor.current = first;
      const nextRow = Math.floor(first / columns(next));
      const nextStep = rowLength(next) + tokens.space[12];
      target = { row: nextRow, y: Math.max(0, rowStart + nextRow * nextStep + into) };
    }
    scrollY.current = target.y;
    setStartAt(target);
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
      <FlatList
        // Two columns cannot be set on a list already laid out in one.
        key={view}
        data={exercises === null ? [] : shown}
        keyExtractor={(e) => e.id}
        renderItem={view === 'list' ? renderRow : renderTile}
        numColumns={perRow}
        columnWrapperStyle={perRow > 1 ? { gap: tokens.space[12] } : undefined}
        ItemSeparatorComponent={Gap}
        initialNumToRender={firstBatch}
        maxToRenderPerBatch={firstBatch}
        getItemLayout={getItemLayout}
        initialScrollIndex={startAt.row}
        contentOffset={{ x: 0, y: startAt.y }}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        style={{ flexGrow: 1 }}
        contentContainerStyle={{
          // Clears the native bar's buttons, which sit in the 44pt under the
          // status bar.
          paddingTop: insets.top + tokens.sizing.tapTarget.ios + tokens.space[16],
          paddingHorizontal: tokens.space[24],
          paddingBottom: Math.max(tokens.space[24], insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
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
        }
        ListEmptyComponent={
          exercises === null ? null : (
            <EmptyState line={exercises.length === 0 ? 'No exercises yet.' : 'No exercises match.'} />
          )
        }
      />

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

function same(a: readonly Exercise[], b: readonly Exercise[]) {
  return (
    a.length === b.length &&
    a.every((e, i) => e.id === b[i].id && e.name === b[i].name && e.icon === b[i].icon && e.type === b[i].type)
  );
}

function Gap() {
  return <View style={{ height: tokens.space[12] }} />;
}
