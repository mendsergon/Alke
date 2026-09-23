import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../components/screen';
import { EmptyState, Pill } from '../../components/surfaces';
import { MuscleCategories } from '../../components/muscle-categories';
import { SwitchScreen } from '../../components/switch-screen';
import { PagerSwitch } from '../../components/pager-switch';
import { useState } from 'react';
import { Icon } from '../../components/icon';
import { GlassButton } from '../../components/glass-button';
import { DayDots, ProgramCard, weekLine } from '../../components/program-card';
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
/** Page 05's Programs / Exercises switch, set top right. */
const SIDES = ['Programs', 'Favorite exercises'] as const;

export default function Library() {
  const router = useRouter();
  const { programs } = useLibrary();
  const [side, setSide] = useState<(typeof SIDES)[number]>('Programs');

  return (
    // The header stays; the two sides slide under it, and each keeps its own
    // scroll.
    <SwitchScreen
      gap={tokens.space[16]}
      index={SIDES.indexOf(side)}
      onIndexChange={(i) => setSide(SIDES[i] ?? 'Programs')}
      header={(progress) =>
        <>
          {/* OPEN: the program builder is not designed yet (PLAN.md §3), so the + opens nothing. */}
          <ScreenHeader
            title="Library"
            subtitle="Your programs"
            action={<GlassButton icon="plus" label="Create a program" />}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <PagerSwitch options={SIDES} value={side} onChange={setSide} progress={progress} />
          </View>
        </>
      }
      pages={[
        programs.length > 0 ? (
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
        ),
        <MuscleCategories />,
      ]}
    />
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
            {/* Everything in Library is saved; only the active program is marked. */}
            {program.active ? <Pill label="Active" size="regular" /> : null}
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

        </View>
        <Icon name="chevronRight" size={20} color={c.textSecondary} />
      </View>
    </ProgramCard>
  );
}
