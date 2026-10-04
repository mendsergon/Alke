import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../components/icon';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { totals, useElapsed, useSession } from './session';

/**
 * A started session, minimised: the bar over the tabs that design page 07
 * ("Session minimised") draws, and the way back into it. It shows only while a
 * session runs.
 */
export function SessionMiniBar() {
  const { session } = useSession();
  if (!session || session.startedAt == null) return null;
  const { done, planned } = totals(session.exercises.filter((x) => x.info));
  const workout = session.program.days[session.day]?.workouts[session.workout];
  return (
    <Bar
      title={workout?.name ?? session.program.name}
      line={`${done} of ${planned} ${planned === 1 ? 'set' : 'sets'} · ${session.program.name}`}
      startedAt={session.startedAt}
    />
  );
}

function Bar({ title, line, startedAt }: { title: string; line: string; startedAt: number }) {
  const { c } = useTheme();
  const router = useRouter();
  const time = useElapsed(startedAt);
  const bar = tokens.session.miniBar;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Return to session"
      onPress={() => router.push('/session')}
      style={{
        height: bar.height,
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
          {title}
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
