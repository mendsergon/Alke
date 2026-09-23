import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, EmptyState, Pill, PrimaryButton } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useAuth } from '../../auth/auth';
import { useGym } from '../../gym/gym';
import { useLibrary } from '../../library/library';
import { listTemplates, trainingDays, type ProgramRecord } from '../../backend/programs';
import { GYM_PROGRAMS, SHARED_PROGRAMS } from '../../mock/mock-data';

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
      <Txt color={c.textSecondary}>Search programs</Txt>
    </View>
  );
}

/**
 * Seven squares, Monday to Sunday in order. A training day is the accent, a
 * rest day the muted body tone; both are solid. The design fills the first N
 * as a count; this marks the actual days, on Stavros's instruction.
 */
function DayDots({ schedule }: { schedule: ProgramRecord['schedule'] }) {
  const { c } = useTheme();
  const dot = tokens.templateCard.dayDot;
  return (
    <View style={{ flexDirection: 'row', gap: dot.gap, alignItems: 'center' }}>
      {schedule.map((day, i) => (
        <View
          key={i}
          style={{
            width: dot.size,
            height: dot.size,
            borderRadius: dot.radius,
            backgroundColor: day === 'training' ? c.accent : c.iconBody,
          }}
        />
      ))}
    </View>
  );
}

/** A meta chip: a small bordered pill on the page's background tone. */
function MetaChip({ label }: { label: string }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        paddingVertical: tokens.space[4],
        paddingHorizontal: tokens.space[8],
        borderRadius: tokens.radius.chip,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.bg,
      }}
    >
      <Txt variant="micro" color={c.textSecondary}>
        {label}
      </Txt>
    </View>
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

function TemplateCard({ template }: { template: ProgramRecord }) {
  const { c } = useTheme();
  const { programs, save } = useLibrary();
  const [saving, setSaving] = useState(false);
  const card = tokens.templateCard;
  const days = trainingDays(template);
  const restDays = template.schedule.length - days;
  const saved = programs.some((p) => p.copied_from === template.id);

  const chips = [...new Set(template.days.flatMap((d) => d.workouts.map((w) => w.name)))];
  const week = template.days.map((d) => WEEKDAY_SHORT[d.weekday] ?? d.weekday).join(' · ');

  return (
    // OPEN: there is no program detail screen yet, so pressing the card shows
    // that it is pressable and goes nowhere.
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={template.name}
      style={({ pressed }) => ({
        backgroundColor: pressed ? c.surfaceRaised : c.surface,
        borderRadius: tokens.radius.card,
        borderWidth: 1,
        borderColor: c.border,
        padding: tokens.space[16],
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[8] }}>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <Txt variant="serifListTitle" family="serif" weight={500} color={c.text}>
            {template.name}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
            {week}
          </Txt>
        </View>
        <Pill label="Featured" />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: tokens.space[8],
          marginTop: tokens.space[12],
        }}
      >
        <DayDots schedule={template.schedule} />
        <Txt variant="micro" color={c.textSecondary} tnum>
          {days} days a week
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', gap: card.chipGap, flexWrap: 'wrap', marginTop: tokens.space[12] }}>
        {chips.map((chip) => (
          <MetaChip key={chip} label={chip} />
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.space[8],
          marginTop: tokens.space[12],
        }}
      >
        <Txt variant="captionTight" color={c.textSecondary} tnum>
          {restDays} rest days
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? `${template.name} is saved` : `Save ${template.name}`}
          accessibilityState={{ disabled: saved || saving }}
          disabled={saved || saving}
          onPress={() => {
            setSaving(true);
            void save(template).finally(() => setSaving(false));
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.space[4],
            minHeight: tokens.sizing.tapTarget.ios,
            paddingHorizontal: tokens.space[20],
            borderRadius: tokens.radius.rung,
            borderWidth: saved ? 0 : 1,
            borderColor: c.border,
            // The accent is the person's own data, and a saved template is theirs.
            backgroundColor: saved ? c.accentSoft : pressed ? c.surfaceRaised : 'transparent',
          })}
        >
          {saved ? <Icon name="check" size={15} color={c.accent} /> : null}
          <Txt variant="label" weight={600} color={saved ? c.accent : c.text}>
            {saved ? 'Saved' : 'Save'}
          </Txt>
        </Pressable>
      </View>
    </Pressable>
  );
}

/** Home's welcome treatment, placed above the templates. */
function BuildProgram() {
  return (
    <Card tone="accentSoft">
      <Txt variant="serifCardTitle" family="serif" weight={500}>
        Let’s build something to train.
      </Txt>
      <View style={{ marginTop: tokens.space[16] }}>
        <PrimaryButton label="Build my program" icon="orb" />
      </View>
    </Card>
  );
}

/** The featured templates are read from PocketBase; the rest is not served yet. */
export default function Explore() {
  const { c } = useTheme();
  const router = useRouter();
  const { gym } = useGym();
  const { token } = useAuth();
  const [templates, setTemplates] = useState<ProgramRecord[]>([]);

  useEffect(() => {
    let live = true;
    void listTemplates(token).then((items) => {
      if (live && items) setTemplates(items);
    });
    return () => {
      live = false;
    };
  }, [token]);

  return (
    <Screen gap={14}>
      <ScreenHeader title="Explore" subtitle="Programs from other lifters" />
      <BuildProgram />
      <SearchBar />

      <MicroCaps>Featured</MicroCaps>
      {templates.length > 0 ? (
        templates.map((t) => <TemplateCard key={t.id} template={t} />)
      ) : (
        <EmptyState line="No featured programs yet." />
      )}

      <View style={{ height: 4 }} />
      <MicroCaps>Shared by other lifters</MicroCaps>
      {SHARED_PROGRAMS.length > 0 ? null : <EmptyState line="No shared programs yet." />}

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
