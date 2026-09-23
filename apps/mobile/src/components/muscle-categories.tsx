import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { listMuscleCategories, type MuscleCategory } from '../backend/muscles';
import { ProgramCard } from './program-card';

/**
 * The muscle categories, in order, as tiles. The exercises under each are
 * served and none exist yet, so a tile is the category's name only.
 *
 * OPEN: there is no exercise list yet, so a tile presses and opens nothing.
 */
export function MuscleCategories() {
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
      {categories.map((category) => (
        // Two to a row; the space between them is what the two leave over.
        <View key={category.id} style={{ width: '48%' }}>
          <ProgramCard label={category.name}>
            <Txt variant="serifListTitle" family="serif" weight={500} color={c.text} numberOfLines={1}>
              {category.name}
            </Txt>
          </ProgramCard>
        </View>
      ))}
    </View>
  );
}
