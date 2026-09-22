import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, Chip, EmptyState } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { Figure } from '../../figure/figure';
import { FIGURE_STRIPS } from '../../figure/figure.generated';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useGym } from '../../gym/gym';
import { useLibrary } from '../../library/library';
import {
  FEATURED_TEMPLATES,
  GYM_PROGRAMS,
  SHARED_PROGRAMS,
  type Template,
} from '../../mock/mock-data';

const FILTERS = ['All', '3 day', '4 day', '6 day'] as const;

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
      <Txt color={c.textSecondary}>Search templates</Txt>
    </View>
  );
}

function Filters({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {FILTERS.map((f) => {
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

/** Seven squares, one per weekday, filled for the days the template trains. */
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

function TemplateCard({ template }: { template: Template }) {
  const { c } = useTheme();
  const { has, addTemplate } = useLibrary();
  const strip = FIGURE_STRIPS[template.strip];
  const added = has(template.id);

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
          <Txt variant="serifListTitle" family="serif" weight={500}>
            {template.name}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
            {template.focus}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9 }}>
            <DayDots days={template.daysPerWeek} of={template.weekLength} />
            <Txt variant="micro" color={c.textSecondary} tnum>
              {template.daysPerWeek} days a week
            </Txt>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
        {template.chips.map((chip) => (
          <Chip key={chip}>{chip}</Chip>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
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
            Preview
          </Txt>
        </Pressable>
        <View style={{ flexGrow: 1 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: added }}
          disabled={added}
          onPress={() => addTemplate(template)}
          style={{
            height: 34,
            paddingHorizontal: 14,
            borderRadius: tokens.radius.rung,
            backgroundColor: added ? c.surfaceRaised : c.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="captionTight" weight={600} color={added ? c.textSecondary : c.onAccent}>
            {added ? 'In Library' : 'Add to Library'}
          </Txt>
        </Pressable>
      </View>
    </Card>
  );
}

export default function Explore() {
  const { c } = useTheme();
  const router = useRouter();
  const { gym } = useGym();
  const [filter, setFilter] = useState<string>(FILTERS[0]);

  const templates = useMemo(() => {
    if (filter === 'All') return FEATURED_TEMPLATES;
    const days = Number.parseInt(filter, 10);
    return FEATURED_TEMPLATES.filter((t) => t.daysPerWeek === days);
  }, [filter]);

  return (
    <Screen gap={14}>
      <ScreenHeader title="Explore" subtitle="Templates to start from" />
      <SearchBar />
      <Filters value={filter} onChange={setFilter} />

      <MicroCaps>Featured templates</MicroCaps>
      {templates.length > 0 ? (
        templates.map((t) => <TemplateCard key={t.id} template={t} />)
      ) : (
        <EmptyState line={`No template runs ${filter.toLowerCase()} a week.`} />
      )}

      <View style={{ height: 4 }} />
      <MicroCaps>Shared by other lifters</MicroCaps>
      {SHARED_PROGRAMS.length > 0 ? null : (
        <EmptyState line="No shared programs yet." />
      )}

      <View style={{ height: 4 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="gym" size={16} color={gym ? c.accent : c.textSecondary} />
        <MicroCaps color={gym ? c.accent : c.textSecondary}>
          {gym ? `From ${gym.name}` : 'From your gym'}
        </MicroCaps>
      </View>
      {GYM_PROGRAMS.length > 0 ? null : (
        <EmptyState
          line={gym ? 'No programs from your gym yet.' : 'No gym joined.'}
          action={gym ? undefined : 'Join with a code'}
          icon="qr"
          onAction={() => router.push('/join-gym')}
        />
      )}
    </Screen>
  );
}
