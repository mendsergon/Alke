import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, EmptyState, Pill } from '../../components/surfaces';
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

/** Seven squares, one per weekday; as many filled as the week has training days. */
function DayDots({ days }: { days: number }) {
  const { c } = useTheme();
  const dot = tokens.templateCard.dayDot;
  return (
    <View style={{ flexDirection: 'row', gap: dot.gap, alignItems: 'center' }}>
      {Array.from({ length: 7 }, (_, i) => (
        <View
          key={i}
          style={{
            width: dot.size,
            height: dot.size,
            borderRadius: dot.radius,
            backgroundColor: i < days ? c.accent : c.rungTrack,
          }}
        />
      ))}
    </View>
  );
}

function TemplateCard({ template }: { template: ProgramRecord }) {
  const { c } = useTheme();
  const { save } = useLibrary();
  const [saving, setSaving] = useState(false);
  const card = tokens.templateCard;
  const days = trainingDays(template);

  return (
    <Card padding={tokens.space[16]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: tokens.space[8],
            }}
          >
            <Txt variant="serifListTitle" family="serif" weight={500} style={{ flexShrink: 1 }}>
              {template.name}
            </Txt>
            <Pill label="Featured" />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: tokens.space[8],
              marginTop: tokens.space[8],
            }}
          >
            <DayDots days={days} />
            <Txt variant="micro" color={c.textSecondary} tnum>
              {days} days a week
            </Txt>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: tokens.space[12] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Save ${template.name}`}
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={() => {
            setSaving(true);
            void save(template).finally(() => setSaving(false));
          }}
          style={{
            height: card.actionHeight,
            paddingHorizontal: tokens.space[16],
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
