import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, EmptyState, Pill } from '../../components/surfaces';
import { Rung } from '../../components/rung';
import { Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useLibrary } from '../../library/library';
import { trainingDays, type ProgramRecord } from '../../backend/programs';

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
        <Card padding={0} style={{ paddingVertical: tokens.space[20], overflow: 'hidden' }}>
          {programs.map((p, i) => (
            <ProgramListRow key={p.id} program={p} first={i === 0} />
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

const WEEKDAY_SHORT: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

function ProgramListRow({ program, first }: { program: ProgramRecord; first: boolean }) {
  const { c } = useTheme();
  const days = trainingDays(program);
  const status = program.active ? 'Active' : 'Saved';
  const week = program.days.map((d) => WEEKDAY_SHORT[d.weekday] ?? d.weekday).join(' · ');
  return (
    <View>
      {first ? null : (
        <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: tokens.space[20] }} />
      )}
      {/* OPEN: there is no program screen yet, so the row presses and goes nowhere. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={program.name}
        style={({ pressed }) => ({
          paddingHorizontal: tokens.space[20],
          paddingTop: tokens.space[16],
          paddingBottom: tokens.space[12],
          backgroundColor: pressed ? c.surfaceRaised : 'transparent',
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[8] }}>
          <Txt variant="serifListTitle" family="serif" weight={500} style={{ flexGrow: 1, flexShrink: 1 }}>
            {program.name}
          </Txt>
          <Pill label={status} tone={program.active ? 'accent' : 'neutral'} />
        </View>
        <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: 1 }}>
          {week} · {days} days
        </Txt>
        <View style={{ marginTop: tokens.space[8] }}>
          {/* The week it trains: training days out of the seven. */}
          <Rung value={days} target={program.schedule.length} />
        </View>
      </Pressable>
    </View>
  );
}
