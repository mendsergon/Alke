import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../components/surfaces';
import { Icon } from '../components/icon';
import { Rung } from '../components/rung';
import { ExerciseIcon } from '../figure/figure';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { formatRest, useSession } from '../session/session';
import { MOCK_SESSION, type SessionSet } from '../mock/mock-data';

function SetMarker({ set }: { set: SessionSet }) {
  const { c } = useTheme();
  const base = {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  } as const;

  if (set.state === 'done') {
    return (
      <View style={[base, { backgroundColor: c.accent }]}>
        <Icon name="check" size={16} color={c.onAccent} width={2.2} />
      </View>
    );
  }
  const current = set.state === 'current';
  return (
    <View
      style={[
        base,
        {
          borderWidth: current ? 2 : 1,
          borderColor: current ? c.accent : c.border,
        },
      ]}
    >
      <Txt variant="label" weight={600} color={current ? c.accent : c.textSecondary} tnum>
        {set.index}
      </Txt>
    </View>
  );
}

function SetCard({ set }: { set: SessionSet }) {
  const { c } = useTheme();
  const bg =
    set.state === 'current' ? c.accentSoft : set.state === 'done' ? c.surface : 'transparent';
  const fg = set.state === 'empty' ? c.textSecondary : c.text;

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: tokens.radius.row,
        paddingTop: 12,
        paddingHorizontal: 14,
        paddingBottom: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <SetMarker set={set} />
        <View style={{ flexGrow: 1, flexDirection: 'row', alignItems: 'baseline' }}>
          <Txt variant="numeralL" weight={600} color={fg} tnum tracking={-0.015}>
            {set.weight}
          </Txt>
          {set.state === 'empty' ? null : (
            <Txt variant="unitSmall" color={c.textSecondary} style={{ marginLeft: 3 }}>
              kg
            </Txt>
          )}
          <Txt variant="times" color={c.textSecondary} style={{ marginHorizontal: 8 }}>
            ×
          </Txt>
          <Txt variant="numeralL" weight={600} color={fg} tnum tracking={-0.015}>
            {set.reps}
          </Txt>
        </View>
        <View style={{ minWidth: 52, alignItems: 'flex-end' }}>
          <MicroCaps>RIR</MicroCaps>
          <Txt variant="dataValue" color={fg} tnum>
            {set.rir}
          </Txt>
        </View>
      </View>
      <Rung value={set.fill} target={set.target} record={set.record} muted={set.state === 'empty'} />
    </View>
  );
}

export default function Session() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSession();
  const s = MOCK_SESSION;

  const minimise = () => {
    session.minimise();
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Minimise session"
          onPress={minimise}
          style={{ width: 44, height: 44, justifyContent: 'center' }}
        >
          <Icon name="chevronDown" size={24} color={c.textSecondary} width={1.7} />
        </Pressable>
        <MicroCaps>{s.position}</MicroCaps>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exercise options"
          style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <Icon name="dots" size={22} color={c.textSecondary} width={1.5} />
        </Pressable>
      </View>

      <View style={{ paddingTop: 6, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <ExerciseIcon icon={s.icon} size={tokens.iconTile.size.sessionHeader} />
        <View style={{ flexShrink: 1 }}>
          <Txt variant="heading" weight={600} tracking={-0.02}>
            {s.exercise}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: 4 }}>
            {s.last}
          </Txt>
        </View>
      </View>

      <ScrollView
        style={{ flexGrow: 1 }}
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {session.sets.map((set) => (
          <SetCard key={set.index} set={set} />
        ))}
        <View style={{ marginTop: 4 }}>
          <SecondaryButton label="Add set" icon="plus" dashed onPress={session.addSet} />
        </View>
      </ScrollView>

      <View
        style={{
          paddingTop: 16,
          paddingHorizontal: 20,
          paddingBottom: Math.max(24, insets.bottom),
          backgroundColor: c.bg,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Icon name="timer" size={20} color={c.accent} />
          <Txt variant="timerValue" tnum>
            {formatRest(session.restLeft)}
          </Txt>
          <Txt variant="captionTight" color={c.textSecondary} style={{ flexGrow: 1 }}>
            rest of {formatRest(session.restTotal)}
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip rest"
            onPress={session.skipRest}
            style={{
              height: 36,
              paddingHorizontal: 14,
              borderRadius: tokens.radius.rung,
              borderWidth: 1,
              borderColor: c.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="captionTight" weight={500}>
              Skip
            </Txt>
          </Pressable>
        </View>
        <Rung value={session.restTotal - session.restLeft} target={session.restTotal} />
        <View style={{ height: 16 }} />
        <PrimaryButton
          label={session.currentSet ? `Complete set ${session.currentSet}` : 'Finish session'}
          icon="check"
          height={tokens.sizing.primaryButtonHeight.max}
          onPress={() => {
            if (session.currentSet) {
              session.completeSet();
              return;
            }
            session.end();
            router.back();
          }}
        />
      </View>
    </View>
  );
}
