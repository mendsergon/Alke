import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '../../components/screen';
import { HomeHeader, WeekStats } from '../../components/home-parts';
import { Card, EmptyState, PrimaryButton, SecondaryButton } from '../../components/surfaces';
import { Txt } from '../../theme/text';
import { useTheme } from '../../theme/theme';
import { useLibrary } from '../../library/library';
import { WEEK_TARGETS } from '../../mock/mock-data';

/**
 * Home, in the state PLAN.md §2 calls "no program yet": nothing has been
 * logged, so the week shows zero against its target and the report area says
 * there is no report rather than inventing one.
 *
 * The two other states — a training day and a rest day — need a program and a
 * logged session to render. They arrive with the store.
 */
export default function Home() {
  const { c } = useTheme();
  const router = useRouter();
  const { programs } = useLibrary();
  const hasProgram = programs.length > 0;

  return (
    <Screen>
      <HomeHeader title="Welcome" subtitle={hasProgram ? 'Ready when you are' : 'No program yet'} />

      <Card tone="accentSoft">
        <Txt variant="serifCardTitle" family="serif" weight={500}>
          Let’s build something to train.
        </Txt>
        <Txt variant="bodySmall" color={c.textSecondary} style={{ marginTop: 10, marginBottom: 18 }}>
          Six questions — days a week, experience, what you want to bring up. Your gym’s
          equipment decides the exercises. Or start from a template instead.
        </Txt>
        <PrimaryButton label="Build my program" icon="sparkle" disabled />
        <View style={{ height: 10 }} />
        <SecondaryButton
          label="Browse templates"
          icon="compass"
          onPress={() => router.push('/explore')}
        />
        <Txt variant="caption" color={c.textSecondary} style={{ marginTop: 12 }}>
          The generator opens once its questionnaire is designed.
        </Txt>
      </Card>

      <WeekStats stats={WEEK_TARGETS} />

      <EmptyState line="No weekly report yet. It arrives after your first full week of training." />

      <View>
        <SecondaryButton label="Start empty workout" icon="plus" disabled />
        <Txt
          variant="caption"
          color={c.textSecondary}
          style={{ textAlign: 'center', marginTop: 10 }}
        >
          Logging opens once the session screen is wired up.
        </Txt>
      </View>
    </Screen>
  );
}
