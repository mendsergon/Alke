import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, Pill, Row, Segmented } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { Rung } from '../../components/rung';
import { ExerciseIcon } from '../../figure/figure';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import {
  MOCK_EXERCISES,
  MOCK_EXERCISE_COUNT,
  MOCK_PROGRAMS,
  type ProgramRow,
} from '../../mock/mock-data';

const TABS = ['Programs', 'Exercises'] as const;

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
        <View style={{ marginTop: 8 }}>
          <Rung value={program.done} target={program.target} />
        </View>
      </View>
    </Row>
  );
}

export default function Library() {
  const { c } = useTheme();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Programs');

  return (
    <Screen gap={14}>
      <ScreenHeader
        title="Library"
        subtitle="Your programs and exercises"
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New"
            style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <Icon name="plus" size={22} color={c.accent} width={1.7} />
          </Pressable>
        }
      />
      <Segmented options={TABS} value={tab} onChange={setTab} />
      <Card>
        {MOCK_PROGRAMS.map((p, i) => (
          <ProgramListRow key={p.name} program={p} first={i === 0} />
        ))}
      </Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <MicroCaps>Exercises</MicroCaps>
        <Txt variant="captionTight" weight={500} color={c.accent}>
          {MOCK_EXERCISE_COUNT}
        </Txt>
      </View>
      <Card>
        {MOCK_EXERCISES.map((e, i) => (
          <Row key={e.name} first={i === 0}>
            <ExerciseIcon icon={e.icon} size={tokens.iconTile.size.listRow} />
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Txt variant="rowLabel" weight={500}>
                {e.name}
              </Txt>
              <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
                {e.detail}
              </Txt>
            </View>
            <Icon name="chevronRight" size={18} color={c.textSecondary} />
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
