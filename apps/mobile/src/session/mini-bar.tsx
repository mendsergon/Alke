import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../components/icon';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useElapsed, useSession } from './session';

/**
 * A started session, minimised: the bar over the tabs that design page 07
 * ("Session minimised") draws, and the way back into it. It shows only while a
 * session runs.
 */
export function SessionMiniBar() {
  const { session } = useSession();
  if (!session || session.startedAt == null) return null;
  // As page 07 has it: the exercise being done, and where the session is.
  const shown = session.exercises.filter((x) => x.info);
  const at = session.exercises[session.current];
  const index = shown.findIndex((x) => x.key === at?.key);
  const workout = session.program.days[session.day]?.workouts[session.workout];
  const line =
    at && index >= 0
      ? `Set ${Math.min(at.done + 1, at.sets)} of ${at.sets} · exercise ${index + 1} of ${shown.length}`
      : session.program.name;
  return (
    <Bar title={at?.info?.name ?? workout?.name ?? session.program.name} line={line} startedAt={session.startedAt} />
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
