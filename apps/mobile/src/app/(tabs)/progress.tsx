import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, ProPill, Row, Segmented } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { Rung } from '../../components/rung';
import { BodyMap } from '../../components/body-map';
import { E1rmChart } from '../../components/e1rm-chart';
import { ExerciseIcon } from '../../figure/figure';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import {
  MOCK_EXERCISE_DETAIL,
  MOCK_HISTORY,
  MOCK_MUSCLE_SCORES,
  MOCK_REPORTS,
  MOCK_TOP_MUSCLES,
} from '../../mock/mock-data';
import { useRouter } from 'expo-router';

const TABS = ['Overview', 'Exercises', 'History', 'Reports'] as const;
type Tab = (typeof TABS)[number];

const SUBTITLE: Record<Tab, string> = {
  Overview: 'Where you are strongest',
  Exercises: 'Estimated 1RM · Epley',
  History: 'Every session you have logged',
  Reports: 'Weekly reports',
};

function Overview() {
  const { c } = useTheme();
  return (
    <>
      <Card padding={16}>
        <BodyMap scores={MOCK_MUSCLE_SCORES} />
      </Card>
      <Card>
        <MicroCaps>Strongest, relative to you</MicroCaps>
        <View style={{ marginTop: 4 }}>
          {MOCK_TOP_MUSCLES.map((m, i) => (
            <View
              key={m.muscle}
              style={{
                paddingVertical: 9,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: c.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <Txt variant="micro" weight={600} color={c.textSecondary} tnum style={{ width: 18 }}>
                  {i + 1}
                </Txt>
                <Txt variant="rowLabel" weight={500} tracking={0} style={{ flexGrow: 1 }}>
                  {m.muscle}
                </Txt>
                <Txt variant="rowTitle" weight={600} tracking={0} tnum>
                  {m.score}
                </Txt>
              </View>
              <Rung value={m.score} target={100} />
            </View>
          ))}
        </View>
      </Card>
    </>
  );
}

function ExerciseDetail() {
  const { c } = useTheme();
  const d = MOCK_EXERCISE_DETAIL;
  const [range, setRange] = useState(d.activeRange);
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
        <View>
          <MicroCaps>Current e1RM</MicroCaps>
          <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'baseline' }}>
            <Txt variant="numeralXL" weight={600} tnum tracking={-0.015}>
              {d.e1rm}
            </Txt>
            <Txt variant="serifProseSmall" family="sans" weight={500} color={c.textSecondary} tracking={0.01} style={{ marginLeft: 3 }}>
              {d.unit}
            </Txt>
          </View>
        </View>
        <View style={{ paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Icon name="arrowUp" size={16} color={c.accent} width={2} />
          <Txt variant="label" weight={600} color={c.accent} tnum>
            {d.delta}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary}>
            {d.deltaWindow}
          </Txt>
        </View>
      </View>
      <Segmented options={d.ranges} value={range} onChange={setRange} />
      <Card padding={16}>
        <E1rmChart {...d.chart} />
      </Card>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <MicroCaps color={c.recordText}>Records by rep range</MicroCaps>
          <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: c.recordFill }} />
        </View>
        {d.records.map((r, i) => (
          <View
            key={r.range}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 9,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: c.border,
            }}
          >
            <Txt variant="captionTight" weight={600} color={c.textSecondary} tnum style={{ width: 54 }}>
              {r.range}
            </Txt>
            <View style={{ flexGrow: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Txt variant="numeralS" weight={600} tnum>
                {r.weight}
              </Txt>
              <Txt variant="microCaps" caps={false} weight={500} color={c.textSecondary} tracking={0.01} style={{ marginLeft: 3 }}>
                kg
              </Txt>
              <Txt variant="label" weight={400} color={c.textSecondary} style={{ marginHorizontal: 4 }}>
                ×
              </Txt>
              <Txt variant="numeralS" weight={600} tnum>
                {r.reps}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: c.recordFill }} />
              <Txt variant="micro" color={c.textSecondary} tnum>
                {r.date}
              </Txt>
            </View>
          </View>
        ))}
      </Card>
      <Pressable
        accessibilityRole="button"
        style={{
          width: '100%',
          minHeight: 52,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: tokens.radius.button,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Txt variant="label" weight={500}>
          Full history &amp; set-by-set log
        </Txt>
        <ProPill />
      </Pressable>
    </>
  );
}

function History() {
  const { c } = useTheme();
  return (
    <Card>
      {MOCK_HISTORY.map((h, i) => (
        <Row key={`${h.name}-${i}`} first={i === 0}>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Txt variant="rowLabel" weight={500} style={{ flexGrow: 1, flexShrink: 1 }}>
                {h.name}
              </Txt>
              {h.record ? <RecordPill /> : null}
            </View>
            <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: 1 }}>
              {h.detail}
            </Txt>
            <View style={{ marginTop: 8 }}>
              <Rung value={h.done} target={h.target} record={h.record} />
            </View>
          </View>
        </Row>
      ))}
    </Card>
  );
}

function RecordPill() {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: tokens.radius.rung,
        backgroundColor: c.recordSoft,
      }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: c.recordFill }} />
      <MicroCaps color={c.recordText}>PR</MicroCaps>
    </View>
  );
}

function Reports() {
  const { c } = useTheme();
  const router = useRouter();
  return (
    <>
      <Card tone="accentSoft">
        <MicroCaps color={c.accent}>Latest</MicroCaps>
        <Txt variant="serifPanelTitle" family="serif" weight={500} style={{ marginTop: 6 }}>
          {MOCK_REPORTS.latest.week}
        </Txt>
        <Txt variant="serifProseSmall" family="serif" weight={400} style={{ marginTop: 8 }}>
          {MOCK_REPORTS.latest.prose}
        </Txt>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/report')}
          style={{
            marginTop: 16,
            width: '100%',
            height: 44,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: tokens.radius.button,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="rowLabel" weight={500} tracking={0}>
            Read the report
          </Txt>
        </Pressable>
      </Card>
      <Card>
        <MicroCaps>Archive</MicroCaps>
        <View style={{ marginTop: 4 }}>
          {MOCK_REPORTS.archive.map((a, i) => (
            <Row key={a.week} first={i === 0}>
              <View style={{ flexGrow: 1, flexShrink: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Txt variant="rowLabel" weight={500} style={{ flexGrow: 1, flexShrink: 1 }}>
                    {a.week}
                  </Txt>
                  <Icon name="chevronRight" size={18} color={c.textSecondary} />
                </View>
                <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: 1 }}>
                  {a.detail}
                </Txt>
                <View style={{ marginTop: 8 }}>
                  <Rung value={a.done} target={a.target} />
                </View>
              </View>
            </Row>
          ))}
        </View>
      </Card>
    </>
  );
}

export default function Progress() {
  const { c } = useTheme();
  const [tab, setTab] = useState<Tab>('Overview');
  const d = MOCK_EXERCISE_DETAIL;

  return (
    <Screen gap={tab === 'Exercises' ? 16 : 14}>
      {tab === 'Exercises' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <ExerciseIcon icon={d.icon} size={tokens.iconTile.size.exerciseDetail} />
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <ScreenHeader
              title={d.name}
              subtitle={SUBTITLE.Exercises}
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change exercise"
                  style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
                >
                  <Icon name="dots" size={22} color={c.textSecondary} width={1.5} />
                </Pressable>
              }
            />
          </View>
        </View>
      ) : (
        <ScreenHeader title="Progress" subtitle={SUBTITLE[tab]} />
      )}

      <Segmented options={TABS} value={tab} onChange={setTab} />

      {tab === 'Overview' ? <Overview /> : null}
      {tab === 'Exercises' ? <ExerciseDetail /> : null}
      {tab === 'History' ? <History /> : null}
      {tab === 'Reports' ? <Reports /> : null}
    </Screen>
  );
}
