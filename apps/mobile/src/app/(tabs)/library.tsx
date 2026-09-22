import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, EmptyState, Pill, Row } from '../../components/surfaces';
import { Rung } from '../../components/rung';
import { Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useLibrary } from '../../library/library';
import type { ProgramRow } from '../../mock/mock-data';

/**
 * Library is the user's own programs — created, forked, saved — and nothing
 * else (PLAN.md §2).
 *
 * There is no segmented control and no exercise list here. The screen is one
 * column of program rows, each carrying its progress as a rung, which is the
 * only quantity on it.
 */
export default function Library() {
  const router = useRouter();
  const { programs } = useLibrary();

  return (
    <Screen gap={tokens.space[16]}>
      <ScreenHeader title="Library" subtitle="Your programs" />

      {programs.length > 0 ? (
        <Card>
          {programs.map((p, i) => (
            <ProgramListRow key={p.name} program={p} first={i === 0} />
          ))}
        </Card>
      ) : (
        <EmptyState
          line="No programs yet."
          action="Build my program"
          icon="orb"
          secondary="Browse templates"
          secondaryIcon="compass"
          onSecondary={() => router.push('/explore')}
        />
      )}
    </Screen>
  );
}

function ProgramListRow({ program, first }: { program: ProgramRow; first: boolean }) {
  const { c } = useTheme();
  return (
    <Row first={first}>
      <View style={{ flexGrow: 1, flexShrink: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Txt variant="rowLabel" weight={500} style={{ flexGrow: 1, flexShrink: 1 }}>
            {program.name}
          </Txt>
          <Pill label={program.status} tone={program.status === 'Active' ? 'accent' : 'neutral'} />
        </View>
        <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: 1 }}>
          {program.detail}
        </Txt>
        <View style={{ marginTop: tokens.space[8] }}>
          <Rung value={program.done} target={program.target} />
        </View>
      </View>
    </Row>
  );
}
