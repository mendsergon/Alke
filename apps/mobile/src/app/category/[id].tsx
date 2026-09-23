import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/surfaces';
import { ProgramCard } from '../../components/program-card';
import { GlassButton } from '../../components/glass-button';
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
  const router = useRouter();
  const { token } = useAuth();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);

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

        {exercises === null ? null : exercises.length === 0 ? (
          <EmptyState line="No exercises yet." />
        ) : (
          <View style={{ gap: tokens.space[12] }}>
            {exercises.map((e) => (
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
        )}
      </ScrollView>

      <View style={{ position: 'absolute', top: insets.top + tokens.space[20], left: tokens.space[20] }}>
        <GlassButton icon="chevronLeft" label="Back" onPress={() => router.back()} />
      </View>
    </View>
  );
}
