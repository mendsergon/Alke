import { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { listMuscleCategories, type MuscleCategory } from '../backend/muscles';
import { cachedExercisesIn, prefetchExercises } from '../backend/exercises';
import { exerciseIconUri } from '../figure/figure';
import { exerciseGridTile } from './exercise-grid';
import { useAuth } from '../auth/auth';
import { ProgramCard } from './program-card';
import { GroupIcon } from '../figure/muscle-groups';

/**
 * The muscle categories, in order, as tiles: each group's crop of the body,
 * drawn the way Progress draws it (`components/body-map.tsx`) — every muscle
 * seamed and visible — with the group's muscles lit, over its name.
 *
 * On Explore a tile opens the category's exercises; in Library, where
 * favorites have no data yet, it opens nothing.
 */
export function MuscleCategories({ onOpen }: { onOpen?: (category: MuscleCategory) => void } = {}) {
  const { c } = useTheme();
  const [categories, setCategories] = useState<MuscleCategory[]>([]);
  const { token } = useAuth();
  const opens = onOpen !== undefined;
  const { width } = useWindowDimensions();

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void listMuscleCategories().then((items) => {
      if (live && items) setCategories(items);
      // Where a tile opens its exercises, have them before it is tapped, and
      // their grid icons drawn: a category opens on its grid, and drawing a
      // tile-sized icon while the screen slides in stalls the slide. One icon
      // per turn of the event loop, so nothing here holds up a frame.
      if (!items || !opens) return;
      void prefetchExercises(items, token).then(() => {
        const tile = exerciseGridTile(width);
        const icons = items.flatMap((category) => cachedExercisesIn(category.id) ?? []);
        const next = (i: number) => {
          if (!live || i >= icons.length) return;
          const e = icons[i];
          if (e.icon) exerciseIconUri(e.icon, tile, c, e.main, e.secondary, true);
          timer = setTimeout(() => next(i + 1), 0);
        };
        next(0);
      });
    });
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [opens, token, width, c]);

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: tokens.space[12],
      }}
    >
      {categories.map((category) => (
        // Three to a row; the space between them is what the three leave over.
        <View key={category.id} style={{ width: '31.5%' }}>
          <ProgramCard
            label={category.name}
            padding={tokens.space[12]}
            onPress={onOpen ? () => onOpen(category) : undefined}
          >
            <View style={{ alignItems: 'center', gap: tokens.space[8] }}>
              <GroupIcon
                base={category.icon}
                muscles={category.icon_muscles}
                viewBox={category.icon_crop || undefined}
                size={tokens.iconTile.size.sessionHeader}
                seamAll
              />
              <Txt
                variant="serifTileName"
                family="serif"
                weight={500}
                color={c.text}
                numberOfLines={1}
              >
                {category.name}
              </Txt>
            </View>
          </ProgramCard>
        </View>
      ))}
    </View>
  );
}
