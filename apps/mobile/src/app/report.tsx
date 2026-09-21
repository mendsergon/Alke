import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, ProPill } from '../components/surfaces';
import { Icon, type IconName } from '../components/icon';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { MOCK_WEEKLY_REPORT, type Recommendation } from '../mock/mock-data';

const MARK: Record<Recommendation['verdict'], IconName> = {
  more: 'arrowUp',
  keep: 'equals',
  less: 'arrowDown',
};

function Change({ item, first }: { item: Recommendation; first: boolean }) {
  const { c } = useTheme();
  const on = item.verdict === 'more';
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 12,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.border,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          backgroundColor: on ? c.accentSoft : c.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={MARK[item.verdict]} size={17} color={on ? c.accent : c.textSecondary} width={1.9} />
      </View>
      <View style={{ flexGrow: 1, flexShrink: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Txt variant="rowLabel" weight={600} tracking={0}>
            {item.muscle}
          </Txt>
          <Txt
            variant="micro"
            weight={600}
            caps
            tracking={0.08}
            color={on ? c.accent : c.textSecondary}
          >
            {item.verdict}
          </Txt>
        </View>
        <Txt variant="caption" color={c.textSecondary} style={{ marginTop: 3 }}>
          {item.reason}
        </Txt>
      </View>
    </View>
  );
}

export default function Report() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const r = MOCK_WEEKLY_REPORT;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + tokens.space[24],
        paddingHorizontal: tokens.space[24],
        paddingBottom: tokens.space[20] + insets.bottom,
        gap: 18,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexShrink: 1 }}>
          <Txt variant="screenTitle" family="serif" weight={500}>
            {r.week}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
            {r.dates}
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <Icon name="chevronLeft" size={24} color={c.textSecondary} width={1.5} />
        </Pressable>
      </View>

      <Card>
        <Txt variant="reportProse" family="serif" weight={400} tracking={-0.003}>
          {r.prose}
        </Txt>
      </Card>

      <Card>
        <MicroCaps>What to change</MicroCaps>
        <View style={{ marginTop: 4 }}>
          {r.recommendations.map((item, i) => (
            <Change key={item.muscle} item={item} first={i === 0} />
          ))}
        </View>
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
          Per-muscle breakdown
        </Txt>
        <ProPill />
      </Pressable>
    </ScrollView>
  );
}
