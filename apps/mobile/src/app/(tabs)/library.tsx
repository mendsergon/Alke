import { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
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
import {
  EXERCISE_ICONS,
  MUSCLE_REGIONS,
  type ExerciseIconKey,
} from '../../figure/figure.generated';
import { Figure } from '../../figure/figure';

const TABS = ['Programs', 'Exercises'] as const;

/**
 * The muscle groups, in Stavros's order. Several are whole regions rather
 * than the single muscles the body map draws, so each one lights every muscle
 * it covers: Back is lats, traps and erectors together, Shoulders is all
 * three delt heads, Forearms carries brachialis and Abs carries obliques.
 *
 * `base` only supplies the crop and the paint order from the generated icon
 * set; the accent is rebuilt from MUSCLE_REGIONS below.
 */
const MUSCLE_GROUPS: {
  name: string;
  base: ExerciseIconKey;
  muscles: string[];
  /** Overrides the base icon's crop when it frames the wrong thing. */
  viewBox?: string;
}[] = [
  { name: 'Chest', base: 'bench', muscles: ['Chest'] },
  { name: 'Back', base: 'row', muscles: ['Lats', 'Traps', 'Erectors'] },
  { name: 'Biceps', base: 'curl', muscles: ['Biceps'] },
  { name: 'Triceps', base: 'pushdown', muscles: ['Triceps'] },
  { name: 'Shoulders', base: 'ohp', muscles: ['Delts', 'Side delts'] },
  { name: 'Quads', base: 'squat', muscles: ['Quads'] },
  { name: 'Hamstrings', base: 'rdl', muscles: ['Hamstrings'] },
  { name: 'Adductors', base: 'adduction', muscles: ['Adductors'] },
  { name: 'Glutes', base: 'hipthrust', muscles: ['Glutes'], viewBox: '116.0 286.0 160.0 160.0' },
  { name: 'Calves', base: 'calfraise', muscles: ['Calves'] },
  // MUSCLE_REGIONS['Obliques'] runs 19 to 28, but 19 and 20 are lats and
  // 27 and 28 are hip flexors, so the obliques are named by region here
  // rather than by that entry.
  { name: 'Abs', base: 'crunch', muscles: ['Abs', '#21', '#22', '#23', '#24', '#25', '#26'] },
  { name: 'Forearms', base: 'wristcurl', muscles: ['Forearms', 'Brachialis'] },
  // Back view. Region 14 is the neck there; MUSCLE_REGIONS only maps the
  // front one, so it is named by region.
  { name: 'Neck', base: 'row', muscles: ['#14'], viewBox: '131.5 0.0 120.0 120.0' },
];

/** An icon tile that lights every muscle in the group, not just one of them. */
function GroupIcon({
  base,
  muscles,
  size,
  viewBox,
}: {
  base: ExerciseIconKey;
  muscles: string[];
  size: number;
  viewBox?: string;
}) {
  const { c } = useTheme();
  const def = EXERCISE_ICONS[base];
  const accent = muscles.flatMap((m) => {
    // '#n' names a single figure region, for groups the muscle map splits oddly.
    if (m.startsWith('#')) return [Number(m.slice(1))];
    const region = MUSCLE_REGIONS[m];
    return region && region.view === def.view ? [...region.regions] : [];
  });
  const inner = size - 4;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: tokens.iconTile.radiusAbove56,
        backgroundColor: c.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Figure
        view={def.view}
        viewBox={viewBox ?? def.viewBox}
        paint={def.paint}
        accent={accent}
        width={inner}
        height={inner}
        strokeWidth={def.strokeWidth}
      />
    </View>
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
  const { width } = useWindowDimensions();
  // Three across, and small enough that all twelve fit without scrolling.
  const tile = Math.min(82, Math.floor((width - tokens.space[24] * 2 - tokens.space[12] * 2) / 3));
  const { programs } = useLibrary();
  const exercises = [...EXERCISE_CATALOG, ...USER_CUSTOM_EXERCISES];
  // The exercises inside a group are served, so a group stays empty until the
  // backend fills it.
  const [group, setGroup] = useState<string | null>(null);
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
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                rowGap: tokens.space[16],
              }}
            >
              {MUSCLE_GROUPS.map((g) => (
                <Pressable
                  key={g.name}
                  accessibilityRole="button"
                  onPress={() => setGroup(g.name)}
                  style={{ width: tile, alignItems: 'center', gap: 8 }}
                >
                  <GroupIcon base={g.base} muscles={g.muscles} size={tile} viewBox={g.viewBox} />
                  <Txt variant="captionTight" weight={500} numberOfLines={1}>
                    {g.name}
                  </Txt>
                </Pressable>
              ))}
            </View>
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
