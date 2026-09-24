import { useEffect, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
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
import { listExercisesIn, type Exercise } from '../../backend/exercises';

/**
 * A muscle category's exercises: every exercise whose main muscle it is, as
 * PocketBase holds them. Each is its own card, as programs are — the icon
 * drawn the way Progress draws the body, and the name.
 *
 * OPEN: there is no exercise screen yet, so a card opens nothing.
 */
// The back, list and grid icons (components/icon.tsx), as images for the
// native bar buttons.
const BACK_ICON = require('../../../assets/images/back.png');
const VIEW_ICON = {
  list: require('../../../assets/images/view-list.png'),
  grid: require('../../../assets/images/view-grid.png'),
};

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
  // Two columns across the page's content width; the icon fills its card
  // inside the card's padding and 1px border.
  const card = (width - 2 * tokens.space[24] - tokens.space[12]) / 2;
  const tile = card - 2 * tokens.space[12] - 2;
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
          // Clears the native bar's buttons, which sit in the 44pt under the
          // status bar.
          paddingTop: insets.top + tokens.sizing.tapTarget.ios + tokens.space[16],
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
          // A card on the page with the raised icon tile inside it (design
          // page 29, surfaces), then the name held to two lines and the type,
          // as the exercise set on page 31 labels them. Every card is the same
          // height, so the rows line up.
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space[12] }}>
            {shown.map((e) => (
              <View key={e.id} style={{ width: card }}>
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
            ))}
          </View>
        )}
      </ScrollView>

      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon={BACK_ICON}
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
              onPress={() => setView('list')}
            >
              List
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction
              icon={VIEW_ICON.grid}
              iconRenderingMode="template"
              isOn={view === 'grid'}
              onPress={() => setView('grid')}
            >
              Grid
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar>
      ) : null}
    </View>
  );
}
