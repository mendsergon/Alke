import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, Chip } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { Figure } from '../../figure/figure';
import { FIGURE_STRIPS } from '../../figure/figure.generated';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useGym } from '../../gym/gym';
import {
  MOCK_EXPLORE_FILTERS,
  MOCK_SHARED_PROGRAMS,
  type SharedProgram,
} from '../../mock/mock-data';

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
      <Txt color={c.textSecondary}>Search programs and templates</Txt>
    </View>
  );
}

/**
 * The export draws the first chip filled and the rest quiet, so the chips are
 * a filter, not a caption. 'Featured' is the whole curated page.
 *
 * OPEN: the tag taxonomy behind Strength / Hypertrophy / 3 day is not fixed by
 * PLAN.md. These predicates read the mock chips and are placeholders.
 */
function Filters({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {MOCK_EXPLORE_FILTERS.map((f) => {
        const on = f === value;
        return (
          <Pressable
            key={f}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(f)}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 13,
              borderRadius: tokens.radius.rung,
              backgroundColor: on ? c.accent : c.surface,
            }}
          >
            <Txt variant="captionTight" weight={on ? 600 : 500} color={on ? c.onAccent : c.textSecondary}>
              {f}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function matches(program: SharedProgram, filter: string): boolean {
  if (filter === 'Featured') return true;
  if (filter === '3 day') return program.daysPerWeek === 3;
  return program.chips.some((chip) => chip.toLowerCase() === filter.toLowerCase());
}

/** Seven squares, one per weekday, filled for the days the program trains. */
function DayDots({ days, of }: { days: number; of: number }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: of }, (_, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 2,
            backgroundColor: i < days ? c.accent : c.rungTrack,
          }}
        />
      ))}
    </View>
  );
}

function ProgramCard({ program }: { program: SharedProgram }) {
  const { c } = useTheme();
  const strip = FIGURE_STRIPS[program.strip];
  return (
    <Card padding={16}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View
          style={{
            width: 54,
            height: 76,
            borderRadius: tokens.iconTile.radius,
            backgroundColor: c.surfaceRaised,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Figure
            view={strip.view}
            viewBox={strip.viewBox}
            paint={strip.paint}
            accent={strip.accent}
            width={20}
            height={72}
            strokeWidth={strip.strokeWidth}
          />
        </View>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flexShrink: 1 }}>
              <Txt variant="serifListTitle" family="serif" weight={500}>
                {program.name}
              </Txt>
              <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
                {program.by}
              </Txt>
            </View>
            {program.featured ? (
              <View
                style={{
                  paddingVertical: 3,
                  paddingHorizontal: 8,
                  borderRadius: tokens.radius.rung,
                  backgroundColor: c.accentSoft,
                }}
              >
                <MicroCaps color={c.accent}>Featured</MicroCaps>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9 }}>
            <DayDots days={program.daysPerWeek} of={program.weekLength} />
            <Txt variant="micro" color={c.textSecondary} tnum>
              {program.daysPerWeek} days a week
            </Txt>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        {program.chips.map((chip) => (
          <Chip key={chip}>{chip}</Chip>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <Icon name="users" size={15} color={c.textSecondary} width={1.5} />
        <Txt variant="micro" color={c.textSecondary} tnum style={{ flexGrow: 1 }}>
          {program.saves}
        </Txt>
        <Pressable
          accessibilityRole="button"
          style={{
            height: 34,
            paddingHorizontal: 14,
            borderRadius: tokens.radius.rung,
            borderWidth: 1,
            borderColor: c.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="captionTight" weight={600}>
            Save
          </Txt>
        </Pressable>
      </View>
    </Card>
  );
}

export default function Explore() {
  const { c } = useTheme();
  const { gym } = useGym();
  const [filter, setFilter] = useState(MOCK_EXPLORE_FILTERS[0]!);
  const [featured, fromGym, other] = MOCK_SHARED_PROGRAMS;

  const shown = useMemo(
    () => ({
      featured: featured && matches(featured, filter) ? featured : null,
      fromGym: fromGym && matches(fromGym, filter) ? fromGym : null,
      other: other && matches(other, filter) ? other : null,
    }),
    [filter, featured, fromGym, other],
  );
  const empty = !shown.featured && !shown.fromGym && !shown.other;

  return (
    <Screen gap={14}>
      <ScreenHeader title="Explore" subtitle="Programs from other lifters" />
      <SearchBar />
      <Filters value={filter} onChange={setFilter} />
      {shown.featured ? <ProgramCard program={shown.featured} /> : null}
      {shown.fromGym ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="gym" size={16} color={c.accent} />
            <MicroCaps color={c.accent}>From {gym.name}</MicroCaps>
          </View>
          <ProgramCard program={shown.fromGym} />
        </>
      ) : null}
      {shown.other ? (
        <>
          <View style={{ height: 12 }} />
          <ProgramCard program={shown.other} />
        </>
      ) : null}
      {empty ? (
        <Card>
          <Txt variant="rowLabel" weight={500}>
            Nothing under {filter} yet.
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 4 }}>
            Pick another filter, or search for a program by name.
          </Txt>
        </Card>
      ) : null}
    </Screen>
  );
}
