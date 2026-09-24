import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useBack } from '../../navigation/use-back';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/surfaces';
import { ProgramCard } from '../../components/program-card';
import { GlassButton } from '../../components/glass-button';
import { SearchBar } from '../../components/search-bar';
import { ExerciseIcon } from '../../figure/figure';
import { Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useAuth } from '../../auth/auth';
import { listExercisesIn, type Exercise } from '../../backend/exercises';

/**
 * A muscle category's exercises: every exercise whose main muscle it is, as
 * PocketBase holds them. Each is its own card, as programs are — the icon
 * drawn the way Progress draws the body, and the name.
 *
 * OPEN: there is no exercise screen yet, so a card opens nothing.
 */
export default function CategoryScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const back = useBack('/explore');
  const { token } = useAuth();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const { width } = useWindowDimensions();
  // Two columns across the page's content width.
  const tile = (width - 2 * tokens.space[24] - tokens.space[16]) / 2;
  const q = query.trim().toLowerCase();
  const shown = exercises?.filter((e) => e.name.toLowerCase().includes(q)) ?? [];

  useEffect(() => {
    let live = true;
    void listExercisesIn(id, token).then((items) => {
      if (live) setExercises(items ?? []);
    });
    return () => {
      live = false;
    };
  }, [id, token]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        style={{ flexGrow: 1 }}
        contentContainerStyle={{
          // Clears the back bubble, as Account does.
          paddingTop: insets.top + tokens.space[20] + tokens.sizing.tapTarget.ios + tokens.space[16],
          paddingHorizontal: tokens.space[24],
          paddingBottom: Math.max(tokens.space[24], insets.bottom),
          gap: tokens.space[16],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Txt variant="screenTitle" family="serif" weight={500}>
          {name ?? ''}
        </Txt>

        {exercises !== null && exercises.length > 0 ? (
          <SearchBar value={query} onChange={setQuery} label="Search exercises" />
        ) : null}

        {exercises === null ? null : exercises.length === 0 ? (
          <EmptyState line="No exercises yet." />
        ) : shown.length === 0 ? (
          <EmptyState line="No exercises match." />
        ) : view === 'list' ? (
          <View style={{ gap: tokens.space[12] }}>
            {shown.map((e) => (
              <ProgramCard key={e.id} label={e.name} padding={tokens.space[16]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[16] }}>
                  <ExerciseIcon icon={e.icon} size={tokens.iconTile.size.sessionHeader} seamAll />
                  <Txt variant="serifListTitle" family="serif" weight={500} color={c.text} style={{ flexShrink: 1 }}>
                    {e.name}
                  </Txt>
                </View>
              </ProgramCard>
            ))}
          </View>
        ) : (
          // The design's exercise set (page 31): the tile itself is the
          // surface, the name sits under it on the page.
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: tokens.space[16], rowGap: tokens.space[24] }}>
            {shown.map((e) => (
              <Pressable key={e.id} accessibilityRole="button" accessibilityLabel={e.name} style={{ width: tile, gap: tokens.space[8] }}>
                <ExerciseIcon icon={e.icon} size={tile} seamAll />
                <Txt variant="rowTitle" color={c.text}>
                  {e.name}
                </Txt>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', top: insets.top + tokens.space[20], left: tokens.space[20] }}>
        <GlassButton icon="chevronLeft" label="Back" onPress={back} />
      </View>
      {exercises !== null && exercises.length > 0 ? (
        <View style={{ position: 'absolute', top: insets.top + tokens.space[20], right: tokens.space[20] }}>
          <GlassButton
            icon={view}
            label={view === 'list' ? 'List view, switch to grid' : 'Grid view, switch to list'}
            onPress={() => setView(view === 'list' ? 'grid' : 'list')}
          />
        </View>
      ) : null}
    </View>
  );
}
