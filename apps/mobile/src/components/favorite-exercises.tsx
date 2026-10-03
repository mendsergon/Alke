import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from '../auth/auth';
import { listMuscleCategories, type MuscleCategory } from '../backend/muscles';
import { cachedExercisesIn, listExercisesIn, unstarExercise, type Exercise } from '../backend/exercises';
import { ExerciseIcon } from '../figure/figure';
import { GroupIcon } from '../figure/muscle-groups';
import { EmptyState } from './surfaces';
import { Star } from './exercise-star';

/** An exercise and the muscle group it is filed under. */
export type Favorite = { exercise: Exercise; category: MuscleCategory };

export type FavoriteExercises = {
  categories: MuscleCategory[];
  /** Every favorite, in the categories' order; null until they are known. */
  favorites: Favorite[] | null;
  /** The muscle group picked, or none: every favorite shows. */
  picked: string | null;
  pick: (category: string) => void;
  unstar: (f: Favorite) => void;
};

/**
 * The Library's favorite exercises (Stavros, 3 October 2026): the person's
 * starred exercises, and the muscle group picked to narrow them to. With no
 * group picked every favorite shows; picking a group shows its favorites, and
 * picking it again shows all of them.
 */
export function useFavoriteExercises(): FavoriteExercises {
  const { token } = useAuth();
  const [categories, setCategories] = useState<MuscleCategory[]>([]);
  const [favorites, setFavorites] = useState<Favorite[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  // Every category's starred exercises, in the categories' order, from the
  // lists the categories were last fetched with.
  const gather = useCallback((list: readonly MuscleCategory[]) => {
    setFavorites(
      list.flatMap((category) =>
        (cachedExercisesIn(category.id) ?? [])
          .filter((e) => e.favorite !== undefined)
          .map((exercise) => ({ exercise, category })),
      ),
    );
  }, []);

  useEffect(() => {
    let live = true;
    void listMuscleCategories().then(async (items) => {
      if (!live || !items) return;
      setCategories(items);
      // A category no list has been fetched for yet is fetched here.
      await Promise.all(items.filter((k) => !cachedExercisesIn(k.id)).map((k) => listExercisesIn(k, token)));
      if (live) gather(items);
    });
    return () => {
      live = false;
    };
  }, [token, gather]);

  // A star given or taken in a category shows here when the Library is back.
  useFocusEffect(
    useCallback(() => {
      if (categories.length > 0) gather(categories);
    }, [categories, gather]),
  );

  const pick = (category: string) => setPicked((now) => (now === category ? null : category));

  const unstar = (f: Favorite) => {
    const favorite = f.exercise.favorite;
    if (!token || !favorite) return;
    setFavorites((prev) => prev?.filter((x) => x.exercise.id !== f.exercise.id) ?? prev);
    void unstarExercise(f.category, f.exercise.id, favorite, token).then((ok) => {
      // Not taken off after all: it comes back where it was.
      if (!ok) gather(categories);
    });
  };

  return { categories, favorites, picked, pick, unstar };
}

/**
 * The muscle groups as their figure tiles, in a row that scrolls sideways and
 * fades into the screen's edges. Pinned over the favorites: they scroll under
 * it, and fade in under its bottom edge rather than being cut by it.
 */
export function FavoriteGroups({ favorites }: { favorites: FavoriteExercises }) {
  return <GroupRow categories={favorites.categories} picked={favorites.picked} onPick={favorites.pick} />;
}

/**
 * The muscle-group row itself, for any screen that narrows exercises by group:
 * the Library's favorites, and the exercises a session adds from.
 */
export function GroupRow({
  categories,
  picked,
  onPick,
}: {
  categories: readonly MuscleCategory[];
  picked: string | null;
  onPick: (category: string) => void;
}) {
  const { c } = useTheme();
  const band = tokens.space[16];
  return (
    // The page puts a gap under every block; the band under the tiles takes
    // its place, so the grid starts where it would without the pin.
    <View style={{ marginHorizontal: -tokens.space[24], marginBottom: -band }}>
      <View style={{ backgroundColor: c.bg }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: tokens.space[24], gap: tokens.space[8] }}
        >
          {categories.map((k) => (
            <GroupTile key={k.id} category={k} on={picked === k.id} onPress={() => onPick(k.id)} />
          ))}
        </ScrollView>
        <Fade direction="left" />
        <Fade direction="right" />
      </View>
      <View pointerEvents="none" style={{ height: band }}>
        <Fade direction="down" />
      </View>
    </View>
  );
}

/** The favorites, or those of the picked group, as a category's grid draws them. */
export function FavoriteGrid({ favorites }: { favorites: FavoriteExercises }) {
  if (favorites.favorites === null) return null;

  const group = favorites.categories.find((k) => k.id === favorites.picked);
  const shown = favorites.favorites.filter((f) => favorites.picked === null || f.category.id === favorites.picked);

  if (shown.length === 0) {
    return (
      <EmptyState line={group ? `No favorite ${group.name.toLowerCase()} exercises yet.` : 'No favorite exercises yet.'} />
    );
  }
  return <ExerciseCards items={shown} onStar={favorites.unstar} />;
}

/** Exercises two across, as a category's grid draws them. */
export function ExerciseCards({
  items,
  onPress,
  onStar,
}: {
  items: readonly Favorite[];
  onPress?: (f: Favorite) => void;
  /** Without it, a signed-out person: no star. */
  onStar?: (f: Favorite) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space[12] }}>
      {items.map((f) => (
        <ExerciseCard key={f.exercise.id} item={f} onPress={onPress} onStar={onStar} />
      ))}
    </View>
  );
}

/**
 * One exercise as a category's grid draws it, half the content's width: the
 * icon, the name, the type and the star. With `onPress` the whole card presses.
 */
export function ExerciseCard({
  item: f,
  onPress,
  onStar,
}: {
  item: Favorite;
  onPress?: (f: Favorite) => void;
  onStar?: (f: Favorite) => void;
}) {
  const { c, cardBorderWidth } = useTheme();
  const { width } = useWindowDimensions();

  // Two cards across, sized as a category's grid sizes them.
  const content = width - 2 * tokens.space[24];
  const card = (content - tokens.space[12]) / 2;
  const tile = card - 2 * tokens.space[12] - 2;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={f.exercise.name}
      disabled={!onPress}
      onPress={onPress ? () => onPress(f) : undefined}
      style={({ pressed }) => ({
        width: card,
        padding: tokens.space[12],
        gap: tokens.space[12],
        borderRadius: tokens.radius.card,
        // Light mode carries a card border; dark does not (PLAN.md §3).
        borderWidth: cardBorderWidth,
        borderColor: c.border,
        // Pressed, the card sinks to the page tone, as a program card does.
        backgroundColor: pressed && onPress ? c.bg : c.surface,
      })}
    >
      {f.exercise.icon ? (
        <ExerciseIcon icon={f.exercise.icon} main={f.exercise.main} secondary={f.exercise.secondary} size={tile} seamAll />
      ) : null}
      <View style={{ gap: tokens.space[4] }}>
        <Txt variant="rowTitle" color={c.text} numberOfLines={2} style={{ minHeight: 2 * tokens.type.rowTitle.lineHeight }}>
          {f.exercise.name}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[8] }}>
          <Txt variant="captionTight" color={c.textSecondary} numberOfLines={1} style={{ flexShrink: 1 }}>
            {f.exercise.type}
          </Txt>
          {onStar ? <Star on={f.exercise.favorite !== undefined} onPress={() => onStar(f)} push /> : null}
        </View>
      </View>
    </Pressable>
  );
}

// A muscle group to show the favorites of: its figure tile, as Explore draws
// the group, with an accent halo when it is picked.
function GroupTile({ category, on, onPress }: { category: MuscleCategory; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.name}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        padding: tokens.space[4],
        borderRadius: tokens.radius.card,
        borderWidth: 1,
        borderColor: on ? c.accent : 'transparent',
        backgroundColor: on ? c.accentSoft : 'transparent',
      }}
    >
      <GroupIcon
        base={category.icon}
        muscles={category.icon_muscles}
        viewBox={category.icon_crop || undefined}
        size={tokens.iconTile.size.sessionHeader}
        seamAll
      />
    </Pressable>
  );
}

// The page's background fading in over an edge: over the row's ends, across
// its margins, and down from under the pinned row.
function Fade({ direction }: { direction: 'left' | 'right' | 'down' }) {
  const { c } = useTheme();
  const across = direction !== 'down';
  const id = `fade-${direction}`;
  const size = across ? tokens.space[24] : '100%';
  const from = direction === 'right' ? 0 : 1;
  return (
    <View
      pointerEvents="none"
      style={
        across
          ? { position: 'absolute', top: 0, bottom: 0, width: tokens.space[24], [direction]: 0 }
          : { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }
      }
    >
      <Svg width={size} height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2={across ? '1' : '0'} y2={across ? '0' : '1'}>
            <Stop offset="0" stopColor={c.bg} stopOpacity={from} />
            <Stop offset="1" stopColor={c.bg} stopOpacity={1 - from} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
