import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../components/screen';
import { Card, EmptyState, Pill, PrimaryButton } from '../../components/surfaces';
import { MuscleCategories } from '../../components/muscle-categories';
import { SwitchScreen } from '../../components/switch-screen';
import { PagerSwitch } from '../../components/pager-switch';
import { Icon } from '../../components/icon';
import { SearchBar } from '../../components/search-bar';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useAuth } from '../../auth/auth';
import { useGym } from '../../gym/gym';
import { useLibrary } from '../../library/library';
import { askDuplicate } from '../../library/duplicate';
import { listPublished, listTemplates, trainingDays, type ProgramRecord } from '../../backend/programs';
import { DayDots, ProgramCard, weekLine } from '../../components/program-card';
import { GYM_PROGRAMS } from '../../mock/mock-data';

/** A template matches when its name or one of its workouts contains the query. */
function matches(template: ProgramRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  if (template.name.toLowerCase().includes(q)) return true;
  return template.days.some((d) => d.workouts.some((w) => w.name.toLowerCase().includes(q)));
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

function TemplateCard({ template, pill = 'Featured' }: { template: ProgramRecord; pill?: string }) {
  const { c } = useTheme();
  const router = useRouter();
  const { save } = useLibrary();
  const [saving, setSaving] = useState(false);
  const days = trainingDays(template);
  const restDays = template.schedule.length - days;
  const chips = [...new Set(template.days.flatMap((d) => d.workouts.map((w) => w.name)))];

  return (
    // The card opens the program: its workouts, and Save.
    <ProgramCard
      label={template.name}
      onPress={() => router.push({ pathname: '/program/[id]', params: { id: template.id } })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[12] }}>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <Txt variant="serifCardTitle" family="serif" weight={500} color={c.text}>
            {template.name}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: tokens.space[4] }}>
            {weekLine(template)}
          </Txt>
        </View>
        <Pill label={pill} size="regular" />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: tokens.space[8],
          marginTop: tokens.space[16],
        }}
      >
        <DayDots schedule={template.schedule} />
        <Txt variant="micro" color={c.textSecondary} tnum>
          {days} days a week
        </Txt>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: tokens.templateCard.chipGap,
          flexWrap: 'wrap',
          marginTop: tokens.space[16],
        }}
      >
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
          marginTop: tokens.space[16],
        }}
      >
        <Txt variant="captionTight" color={c.textSecondary} tnum>
          {restDays} {restDays === 1 ? 'rest day' : 'rest days'}
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Duplicate ${template.name}`}
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={() =>
            askDuplicate(template.name, () => {
              setSaving(true);
              void save(template).finally(() => setSaving(false));
            })
          }
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: tokens.space[4],
            minHeight: tokens.sizing.tapTarget.ios,
            paddingHorizontal: tokens.space[20],
            borderRadius: tokens.radius.rung,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: pressed ? c.bg : 'transparent',
          })}
        >
          <Icon name="duplicate" size={15} color={c.text} />
          <Txt variant="label" weight={600} color={c.text}>
            Duplicate
          </Txt>
        </Pressable>
      </View>
    </ProgramCard>
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

/** Page 05's Programs / Exercises switch, set top right. */
const SIDES = ['Programs', 'Exercises'] as const;

/** The featured templates are read from PocketBase; the rest is not served yet. */
export default function Explore() {
  const { c } = useTheme();
  const router = useRouter();
  const { gym } = useGym();
  const { token, account } = useAuth();
  const [templates, setTemplates] = useState<ProgramRecord[]>([]);
  // Programs other lifters published (Stavros, 4 October 2026).
  const [shared, setShared] = useState<ProgramRecord[]>([]);
  const [query, setQuery] = useState('');
  const [side, setSide] = useState<(typeof SIDES)[number]>('Programs');
  const shown = templates.filter((t) => matches(t, query));

  useEffect(() => {
    if (!token || !account) {
      setShared([]);
      return;
    }
    let live = true;
    void listPublished(token, account.id).then((items) => {
      if (live && items) setShared(items);
    });
    return () => {
      live = false;
    };
  }, [token, account]);

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
    // The header stays; the two sides slide under it, and each keeps its own
    // scroll. Both start 34pt under the header, as they did on one screen.
    <SwitchScreen
      gap={14}
      headerGap={tokens.space[20] + 14}
      // Both sides fade in under the header, as the favorites do under their row.
      fadeTop={[true, true]}
      index={SIDES.indexOf(side)}
      onIndexChange={(i) => setSide(SIDES[i] ?? 'Programs')}
      header={(progress) =>
        <ScreenHeader
          title="Explore"
          action={<PagerSwitch options={SIDES} value={side} onChange={setSide} progress={progress} />}
        />
      }
      pages={[
        <>
      <BuildProgram />
      <SearchBar value={query} onChange={setQuery} label="Search programs" />

      <MicroCaps>Featured</MicroCaps>
      {shown.length > 0 ? (
        // Page 04 keeps 34pt of ground between cards; 32 is the nearest step.
        <View style={{ gap: tokens.space[32] }}>
          {shown.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </View>
      ) : (
        <EmptyState line={templates.length > 0 ? 'No programs match.' : 'No featured programs yet.'} />
      )}

      <View style={{ height: 4 }} />
      <MicroCaps>Shared by other lifters</MicroCaps>
      {shared.length > 0 ? (
        <View style={{ gap: tokens.space[32] }}>
          {shared.map((p) => (
            <TemplateCard key={p.id} template={p} pill="Shared" />
          ))}
        </View>
      ) : (
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
        <EmptyState line={gym ? 'No programs from your gym yet.' : 'No gym joined.'} />
      )}
        </>,
        <MuscleCategories
          onOpen={(category) =>
            router.push({ pathname: '/category/[id]', params: { id: category.id, name: category.name } })
          }
        />,
      ]}
    />
  );
}
