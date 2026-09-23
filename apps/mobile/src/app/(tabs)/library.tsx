import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { EmptyState, Pill } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { DayDots, ProgramCard, weekLine } from '../../components/program-card';
import { Rung } from '../../components/rung';
import { Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useLibrary } from '../../library/library';
import { trainingDays, type ProgramRecord } from '../../backend/programs';

/**
 * Library is the user's own programs — created, forked, saved — and nothing
 * else (PLAN.md §2).
 *
 * There is no segmented control and no exercise list here. Each program is its
 * own card, built like Explore's, so it reads as something to open rather than
 * a line in a list. Page 05 draws rows in one block; this departs from it on
 * Stavros's instruction.
 */
export default function Library() {
  const router = useRouter();
  const { programs } = useLibrary();

  return (
    <Screen gap={tokens.space[16]}>
      <ScreenHeader title="Library" subtitle="Your programs" action={<CreateProgram />} />

      {programs.length > 0 ? (
        // Each program is its own card, on page 04's spacing between cards.
        <View style={{ gap: tokens.space[32] }}>
          {programs.map((p) => (
            <LibraryCard key={p.id} program={p} />
          ))}
        </View>
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

/**
 * Create your own: the "+" page 05 draws top right of Library.
 *
 * OPEN: PLAN.md §3 lists the program builder as not yet designed, so there is
 * nothing for it to open yet.
 */
function CreateProgram() {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create a program"
      hitSlop={tokens.space[4]}
      style={({ pressed }) => ({
        width: tokens.sizing.tapTarget.ios,
        height: tokens.sizing.tapTarget.ios,
        borderRadius: tokens.radius.rung,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? c.accentSoft : 'transparent',
      })}
    >
      <Icon name="plus" size={22} color={c.accent} width={1.75} />
    </Pressable>
  );
}

function LibraryCard({ program }: { program: ProgramRecord }) {
  const { c } = useTheme();
  const days = trainingDays(program);
  return (
    // OPEN: there is no program screen yet, so the card presses and goes nowhere.
    <ProgramCard label={program.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[12] }}>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[12] }}>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Txt variant="serifCardTitle" family="serif" weight={500} color={c.text}>
                {program.name}
              </Txt>
              <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: tokens.space[4] }}>
                {weekLine(program)}
              </Txt>
            </View>
            <Pill
              label={program.active ? 'Active' : 'Saved'}
              tone={program.active ? 'accent' : 'neutral'}
              size="regular"
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: tokens.space[8],
              marginTop: tokens.space[16],
            }}
          >
            <DayDots schedule={program.schedule} />
            <Txt variant="micro" color={c.textSecondary} tnum>
              {days} days a week
            </Txt>
          </View>

          <View style={{ marginTop: tokens.space[16] }}>
            {/* The week it trains: training days out of the seven. */}
            <Rung value={days} target={program.schedule.length} />
          </View>
        </View>
        <Icon name="chevronRight" size={20} color={c.textSecondary} />
      </View>
    </ProgramCard>
  );
}
