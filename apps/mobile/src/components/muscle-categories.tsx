import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { listMuscleCategories, type MuscleCategory } from '../backend/muscles';
import { ProgramCard } from './program-card';
import { GroupIcon, MUSCLE_GROUPS } from '../figure/muscle-groups';

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

  useEffect(() => {
    let live = true;
    void listMuscleCategories().then((items) => {
      if (live && items) setCategories(items);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: tokens.space[12],
      }}
    >
      {categories.map((category) => {
        const group = MUSCLE_GROUPS.find((g) => g.name === category.name);
        return (
            // Three to a row; the space between them is what the three leave over.
          <View key={category.id} style={{ width: '31.5%' }}>
            <ProgramCard
              label={category.name}
              padding={tokens.space[12]}
              onPress={onOpen ? () => onOpen(category) : undefined}
            >
              <View style={{ alignItems: 'center', gap: tokens.space[8] }}>
                {group ? (
                  <GroupIcon
                    base={group.base}
                    muscles={group.muscles}
                    viewBox={group.viewBox}
                    size={tokens.iconTile.size.sessionHeader}
                    seamAll
                  />
                ) : null}
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
        );
      })}
    </View>
  );
}
