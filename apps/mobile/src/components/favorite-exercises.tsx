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

type Favorite = { exercise: Exercise; category: MuscleCategory };

/**
 * The Library's favorite exercises (Stavros, 3 October 2026): the muscle
 * groups as their figure tiles in a row that scrolls sideways, over the
 * person's starred exercises drawn as a category's grid draws them. With no
 * group picked every favorite shows; picking a group shows its favorites, and
 * picking it again shows all of them.
 */
export function FavoriteExercises() {
  const { c, cardBorderWidth } = useTheme();
  const { token } = useAuth();
  const { width } = useWindowDimensions();
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

  const unstar = (f: Favorite) => {
    const favorite = f.exercise.favorite;
    if (!token || !favorite) return;
    setFavorites((prev) => prev?.filter((x) => x.exercise.id !== f.exercise.id) ?? prev);
    void unstarExercise(f.category, f.exercise.id, favorite, token).then((ok) => {
      // Not taken off after all: it comes back where it was.
      if (!ok) gather(categories);
    });
  };

  // Two cards across, sized as a category's grid sizes them.
  const content = width - 2 * tokens.space[24];
  const card = (content - tokens.space[12]) / 2;
  const tile = card - 2 * tokens.space[12] - 2;
  const group = categories.find((k) => k.id === picked);
  const shown = favorites?.filter((f) => picked === null || f.category.id === picked) ?? [];

  return (
    <View style={{ gap: tokens.space[16] }}>
      {/* The row runs to the screen's edges and fades into them, so a group
          scrolled off the margin dissolves rather than being cut. */}
      <View style={{ marginHorizontal: -tokens.space[24] }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: tokens.space[24], gap: tokens.space[8] }}
        >
          {categories.map((k) => (
            <GroupTile
              key={k.id}
              category={k}
              on={picked === k.id}
              onPress={() => setPicked(picked === k.id ? null : k.id)}
            />
          ))}
        </ScrollView>
        <EdgeFade side="left" />
        <EdgeFade side="right" />
      </View>

      {favorites === null ? null : shown.length === 0 ? (
        <EmptyState
          line={group ? `No favorite ${group.name.toLowerCase()} exercises yet.` : 'No favorite exercises yet.'}
        />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space[12] }}>
          {shown.map((f) => (
            <View
              key={f.exercise.id}
              style={{
                width: card,
                padding: tokens.space[12],
                gap: tokens.space[12],
                borderRadius: tokens.radius.card,
                // Light mode carries a card border; dark does not (PLAN.md §3).
                borderWidth: cardBorderWidth,
                borderColor: c.border,
                backgroundColor: c.surface,
              }}
            >
              {f.exercise.icon ? (
                <ExerciseIcon
                  icon={f.exercise.icon}
                  main={f.exercise.main}
                  secondary={f.exercise.secondary}
                  size={tile}
                  seamAll
                />
              ) : null}
              <View style={{ gap: tokens.space[4] }}>
                <Txt
                  variant="rowTitle"
                  color={c.text}
                  numberOfLines={2}
                  style={{ minHeight: 2 * tokens.type.rowTitle.lineHeight }}
                >
                  {f.exercise.name}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[8] }}>
                  <Txt variant="captionTight" color={c.textSecondary} numberOfLines={1} style={{ flexShrink: 1 }}>
                    {f.exercise.type}
                  </Txt>
                  <Star on onPress={() => unstar(f)} push />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
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

// The page's background fading in over one end of the row, across its margin.
function EdgeFade({ side }: { side: 'left' | 'right' }) {
  const { c } = useTheme();
  const width = tokens.space[24];
  const id = `fade-${side}`;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width, [side]: 0 }}>
      <Svg width={width} height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={c.bg} stopOpacity={side === 'left' ? 1 : 0} />
            <Stop offset="1" stopColor={c.bg} stopOpacity={side === 'left' ? 0 : 1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
