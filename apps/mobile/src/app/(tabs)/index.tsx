import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/screen';
import { HomeTopBar, HomeTitle, WeekStats } from '../../components/home-parts';
import { Card, Chip, PrimaryButton, SecondaryButton, Row } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useSession } from '../../session/session';
import {
  MOCK_CHECK_IN,
  MOCK_GYM,
  MOCK_HOME_STATE,
  MOCK_NEXT_AFTER_REST,
  MOCK_NEXT_SESSION,
  MOCK_REPORT_TEASER,
  MOCK_REST_DAY,
  MOCK_STARTING_POINTS,
  MOCK_TODAY,
  MOCK_WEEK,
} from '../../mock/mock-data';

function ReportCard() {
  const { c } = useTheme();
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/report')}>
      <Card tone="accentSoft">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <MicroCaps color={c.accent}>{MOCK_REPORT_TEASER.eyebrow}</MicroCaps>
            <Txt variant="serifRowTitle" family="serif" weight={500} style={{ marginTop: 6 }}>
              {MOCK_REPORT_TEASER.week}
            </Txt>
            <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
              {MOCK_REPORT_TEASER.line}
            </Txt>
          </View>
          <Icon name="chevronRight" size={20} color={c.textSecondary} />
        </View>
      </Card>
    </Pressable>
  );
}

function TrainingDay() {
  const { c } = useTheme();
  const router = useRouter();
  const session = useSession();
  return (
    <>
      <HomeTitle title="Today" subtitle={MOCK_TODAY} />
      <Card>
        <MicroCaps color={c.accent}>Next session</MicroCaps>
        <Txt variant="section" family="serif" weight={500} tracking={-0.005} style={{ marginTop: 8 }}>
          {MOCK_NEXT_SESSION.program}
        </Txt>
        <Txt variant="label" weight={400} color={c.textSecondary} style={{ marginTop: 2 }}>
          {MOCK_NEXT_SESSION.where}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 14, marginBottom: 16 }}>
          {MOCK_NEXT_SESSION.chips.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </View>
        <PrimaryButton
          label="Start workout"
          icon="play"
          onPress={() => {
            session.start();
            router.push('/session');
          }}
        />
      </Card>
      <SecondaryButton
        label="Start empty workout"
        icon="plus"
        onPress={() => {
          session.start();
          router.push('/session');
        }}
      />
      <WeekStats stats={MOCK_WEEK} />
      <ReportCard />
    </>
  );
}

function RestDay() {
  const { c } = useTheme();
  return (
    <>
      <HomeTitle title="Rest day" subtitle={MOCK_REST_DAY} />
      <Card tone="accentSoft">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flexShrink: 1 }}>
            <Txt variant="rowTitle" weight={600}>
              Daily check-in
            </Txt>
            <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
              Five sliders, about forty seconds.
            </Txt>
          </View>
          <Pressable
            accessibilityRole="button"
            style={{
              height: 44,
              paddingHorizontal: 18,
              borderRadius: tokens.radius.rung,
              backgroundColor: c.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="label" weight={600} color={c.onAccent}>
              Start
            </Txt>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
          {MOCK_CHECK_IN.map((slider) => (
            <View key={slider} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 34, height: 34, borderRadius: 999, backgroundColor: c.bg }} />
              <Txt variant="microCaps" caps={false} weight={400} tracking={0} color={c.textSecondary}>
                {slider}
              </Txt>
            </View>
          ))}
        </View>
      </Card>
      <Card>
        <MicroCaps>Next session</MicroCaps>
        <Txt variant="serifRowTitle" family="serif" weight={500} style={{ marginTop: 6 }}>
          {MOCK_NEXT_AFTER_REST.title}
        </Txt>
        <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
          {MOCK_NEXT_AFTER_REST.detail}
        </Txt>
      </Card>
      <WeekStats stats={MOCK_WEEK} />
      <ReportCard />
    </>
  );
}

function NoProgram() {
  const { c } = useTheme();
  return (
    <>
      <HomeTitle title="Welcome" subtitle="No program yet" />
      <Card tone="accentSoft">
        <Txt variant="serifCardTitle" family="serif" weight={500}>
          Let’s build something to train.
        </Txt>
        <Txt
          variant="bodySmall"
          color={c.textSecondary}
          style={{ marginTop: 10, marginBottom: 18 }}
        >
          Six questions — days a week, experience, what you want to bring up. Your gym’s equipment
          decides the exercises.
        </Txt>
        <PrimaryButton label="Build my program" icon="sparkle" />
        <View style={{ height: 10 }} />
        <SecondaryButton label="Browse templates" icon="compass" />
      </Card>
      <Card>
        <MicroCaps>Popular starting points</MicroCaps>
        <View style={{ marginTop: 4 }}>
          {MOCK_STARTING_POINTS.map((p, i) => (
            <Row key={p.name} first={i === 0}>
              <View style={{ flexGrow: 1, flexShrink: 1 }}>
                <Txt variant="rowLabel" weight={500}>
                  {p.name}
                </Txt>
                <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
                  {p.detail}
                </Txt>
              </View>
              <Icon name="chevronRight" size={18} color={c.textSecondary} />
            </Row>
          ))}
        </View>
      </Card>
      <Txt variant="caption" color={c.textSecondary} style={{ textAlign: 'center' }}>
        You can also just start an empty workout and log as you go.
      </Txt>
    </>
  );
}

export default function Home() {
  return (
    <Screen>
      <HomeTopBar gym={MOCK_GYM.shortName} />
      {MOCK_HOME_STATE === 'training' ? <TrainingDay /> : null}
      {MOCK_HOME_STATE === 'rest' ? <RestDay /> : null}
      {MOCK_HOME_STATE === 'no-program' ? <NoProgram /> : null}
    </Screen>
  );
}
