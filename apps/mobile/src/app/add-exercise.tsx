import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../components/screen';
import { EmptyState } from '../components/surfaces';
import { ExerciseCard, GroupRow, type Favorite } from '../components/favorite-exercises';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from '../auth/auth';
import { useSession } from '../session/session';
import { starExercise, unstarExercise } from '../backend/exercises';

/**
 * Adding an exercise to a session (Stavros, 4 October 2026): the Library's
 * favorite-exercises layout — the muscle groups as figure tiles in a pinned
 * row that scrolls sideways, and the cards under it — over every exercise
 * rather than the favorites. They are shuffled each time this opens, so the
 * list is not chest, then back, then the rest. Nothing is picked at first;
 * picking a group narrows to it, picking it again shows all. A card adds its
 * exercise, one set, and closes this.
 */
export default function AddExercise() {
  const { c } = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const { categories, exercisesIn, add } = useSession();
  const [picked, setPicked] = useState<string | null>(null);
  // A star given or taken here, by exercise: the favorite's id, or undefined.
  const [stars, setStars] = useState<ReadonlyMap<string, string | undefined>>(new Map());
  const starring = useRef(new Set<string>());

  // Each exercise's place in the shuffle, drawn once for this opening.
  const order = useRef(new Map<string, number>());
  const all = useMemo(() => {
    const items: Favorite[] = categories.flatMap((category) =>
      exercisesIn(category.id).map((exercise) => ({ exercise, category })),
    );
    for (const f of items) {
      if (!order.current.has(f.exercise.id)) order.current.set(f.exercise.id, Math.random());
    }
    return items.sort((a, b) => (order.current.get(a.exercise.id) ?? 0) - (order.current.get(b.exercise.id) ?? 0));
  }, [categories, exercisesIn]);

  const shown = all
    .filter((f) => picked === null || f.category.id === picked)
    .map((f) =>
      stars.has(f.exercise.id) ? { ...f, exercise: { ...f.exercise, favorite: stars.get(f.exercise.id) } } : f,
    );

  const toggleStar = useCallback(
    (f: Favorite) => {
      const id = f.exercise.id;
      if (!token || starring.current.has(id)) return;
      starring.current.add(id);
      const on = f.exercise.favorite === undefined;
      const mark = (favorite: string | undefined) => setStars((prev) => new Map(prev).set(id, favorite));
      mark(on ? '' : undefined);
      void (async () => {
        if (on) mark((await starExercise(f.category, id, token)) ?? undefined);
        else if (!(await unstarExercise(f.category, id, f.exercise.favorite ?? '', token))) mark(f.exercise.favorite);
        starring.current.delete(id);
      })();
    },
    [token],
  );

  const group = categories.find((k) => k.id === picked);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: tokens.space[24], paddingHorizontal: tokens.space[24], paddingBottom: tokens.space[16] }}>
        <ScreenHeader title="Add exercise" />
      </View>
      {/* Only the cards near the screen are built: every exercise at once
          is too many figures to draw in one go. */}
      <FlatList
        data={categories.length === 0 ? [] : shown}
        keyExtractor={(f) => f.exercise.id}
        numColumns={2}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          // The row's band fades in over this padding, as it does over the
          // page's gap on the Library.
          <View style={{ paddingBottom: tokens.space[16] }}>
            <GroupRow
              categories={categories}
              picked={picked}
              onPick={(k) => setPicked((now) => (now === k ? null : k))}
            />
          </View>
        }
        ListEmptyComponent={
          categories.length === 0 ? null : (
            <EmptyState line={group ? `No ${group.name.toLowerCase()} exercises yet.` : 'No exercises yet.'} />
          )
        }
        columnWrapperStyle={{ gap: tokens.space[12] }}
        ItemSeparatorComponent={Gap}
        contentContainerStyle={{ paddingHorizontal: tokens.space[24], paddingBottom: tokens.space[40] }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ExerciseCard
            item={item}
            onPress={(f) => {
              add(f.exercise, f.category);
              router.back();
            }}
            onStar={token ? toggleStar : undefined}
          />
        )}
      />
    </View>
  );
}

function Gap() {
  return <View style={{ height: tokens.space[12] }} />;
}
