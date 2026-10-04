import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/icon';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { totals, useElapsed, useSession } from './session';

/**
 * A started workout, out of sight: the bar design page 07 ("Session
 * minimised") draws — "Workout in progress", the workout and its sets done,
 * and the time running — and the way back into it (Stavros, 4 October 2026).
 * It shows only while a workout runs. Over the tabs it sits on the tab bar;
 * elsewhere (`floating`) it sits at the foot of the screen, over the home
 * indicator's inset.
 */
export function SessionMiniBar({ floating = false }: { floating?: boolean }) {
  const { session } = useSession();
  if (!session || session.startedAt == null) return null;
  const { done, planned } = totals(session.exercises.filter((x) => x.info));
  const workout = session.program.days[session.day]?.workouts[session.workout];
  return (
    <Bar
      line={`${workout?.name ?? session.program.name} · ${done} of ${planned} ${planned === 1 ? 'set' : 'sets'}`}
      startedAt={session.startedAt}
      floating={floating}
    />
  );
}

function Bar({ line, startedAt, floating }: { line: string; startedAt: number; floating: boolean }) {
  const { c } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const time = useElapsed(startedAt);
  const bar = tokens.session.miniBar;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Workout in progress. Open it"
      onPress={() => router.push('/workout')}
      style={{
        height: bar.height + (floating ? insets.bottom : 0),
        paddingBottom: floating ? insets.bottom : 0,
        paddingHorizontal: bar.paddingHorizontal,
        borderTopWidth: 1,
        borderTopColor: c.border,
        backgroundColor: c.accentSoft,
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.space[12],
      }}
    >
      <View
        style={{
          width: bar.tile,
          height: bar.tile,
          borderRadius: bar.tileRadius,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="chevronUp" size={20} color={c.onAccent} width={1.8} />
      </View>
      <View style={{ flexGrow: 1, flexShrink: 1 }}>
        <Txt variant="label" weight={600} tracking={-0.01} color={c.text} numberOfLines={1}>
          Workout in progress
        </Txt>
        <Txt variant="microTight" color={c.textSecondary} tnum numberOfLines={1}>
          {line}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[8] }}>
        <Icon name="timer" size={18} color={c.accent} />
        <Txt variant="rowTitle" tnum color={c.accent}>
          {time}
        </Txt>
      </View>
    </Pressable>
  );
}
