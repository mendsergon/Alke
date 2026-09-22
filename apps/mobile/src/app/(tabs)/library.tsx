import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, EmptyState, Pill, Row, Segmented } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { Rung } from '../../components/rung';
import { ExerciseIcon } from '../../figure/figure';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useLibrary } from '../../library/library';
import { EXERCISE_CATALOG, USER_CUSTOM_EXERCISES, type ProgramRow } from '../../mock/mock-data';
import { EXERCISE_ICONS, type ExerciseIconKey } from '../../figure/figure.generated';

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

function SearchBar() {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 46,
        paddingHorizontal: 14,
        borderRadius: tokens.radius.button,
        backgroundColor: c.surface,
      }}
    >
      <Icon name="search" size={18} color={c.textSecondary} />
      <Txt color={c.textSecondary}>Search exercises</Txt>
    </View>
  );
}

export default function Library() {
  const { c } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Programs');
  const { programs } = useLibrary();
  const exercises = [...EXERCISE_CATALOG, ...USER_CUSTOM_EXERCISES];
  // One icon per muscle, straight out of the design export's generated icon
  // set. The exercises inside a group are served, so a group stays empty
  // until the backend fills it.
  const [group, setGroup] = useState<string | null>(null);
  const groups = (Object.entries(EXERCISE_ICONS) as [ExerciseIconKey, { muscle: string }][])
    .map(([icon, def]) => ({ muscle: def.muscle, icon }))
    .sort((a, b) => a.muscle.localeCompare(b.muscle));
  const inGroup = group ? exercises.filter((e) => e.muscle === group) : [];

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

      {tab === 'Programs' ? (
        programs.length > 0 ? (
          <Card>
            {programs.map((p, i) => (
              <ProgramListRow key={p.name} program={p} first={i === 0} />
            ))}
          </Card>
        ) : (
          <EmptyState
            line="No programs yet."
            action="Build my program"
            icon="sparkle"
            secondary="Browse templates"
            secondaryIcon="compass"
            onSecondary={() => router.push('/explore')}
          />
        )
      ) : null}

      {tab === 'Exercises' ? (
        <>
          <SearchBar />
          {group === null ? (
            <>
              <MicroCaps>Muscle groups</MicroCaps>
              <Card>
                {groups.map((g, i) => (
                  <Pressable
                    key={g.muscle}
                    accessibilityRole="button"
                    onPress={() => setGroup(g.muscle)}
                  >
                    <Row first={i === 0}>
                      <ExerciseIcon icon={g.icon} size={tokens.iconTile.size.listRow} />
                      <View style={{ flexGrow: 1, flexShrink: 1 }}>
                        <Txt variant="rowLabel" weight={500}>
                          {g.muscle}
                        </Txt>
                      </View>
                      <Icon name="chevronRight" size={18} color={c.textSecondary} />
                    </Row>
                  </Pressable>
                ))}
              </Card>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to muscle groups"
                onPress={() => setGroup(null)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Icon name="chevronLeft" size={18} color={c.accent} width={1.7} />
                <MicroCaps color={c.accent}>{group}</MicroCaps>
              </Pressable>
              {inGroup.length > 0 ? (
                <Card>
                  {inGroup.map((e, i) => (
                    <Row key={e.name} first={i === 0}>
                      <ExerciseIcon icon={e.icon} size={tokens.iconTile.size.listRow} />
                      <View style={{ flexGrow: 1, flexShrink: 1 }}>
                        <Txt variant="rowLabel" weight={500}>
                          {e.name}
                        </Txt>
                        <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
                          {e.equipment}
                        </Txt>
                      </View>
                      <Icon name="chevronRight" size={18} color={c.textSecondary} />
                    </Row>
                  ))}
                </Card>
              ) : (
                <EmptyState line="No exercises yet." />
              )}
            </>
          )}
        </>
      ) : null}

    </Screen>
  );
}
