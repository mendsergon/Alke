import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/theme';
import { Txt } from '../theme/text';
import { Icon } from './icon';
import { formatRest, useSession } from '../session/session';
import { MOCK_SESSION } from '../mock/mock-data';

/** The session, minimised: a persistent bar that sits over the tab bar. */
export function MiniBar() {
  const { c } = useTheme();
  const router = useRouter();
  const session = useSession();

  if (!session.active || !session.minimised) return null;
  const exercise = MOCK_SESSION.exercise;
  const detail = session.currentSet
    ? `Set ${session.currentSet} of ${session.sets.length} · ${MOCK_SESSION.position.toLowerCase()}`
    : `All sets done · ${MOCK_SESSION.position.toLowerCase()}`;
  const timer = formatRest(session.restLeft);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Return to session"
      onPress={() => {
        session.resume();
        router.push('/session');
      }}
      style={{
        width: '100%',
        height: 60,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: c.border,
        backgroundColor: c.accentSoft,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="chevronUp" size={17} color={c.onAccent} width={2} />
      </View>
      <View style={{ flexGrow: 1, flexShrink: 1 }}>
        <Txt variant="label" weight={600} tracking={-0.01} numberOfLines={1}>
          {exercise}
        </Txt>
        <Txt variant="microTight" color={c.textSecondary} tnum>
          {detail}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="timer" size={16} color={c.accent} />
        <Txt variant="rowTitle" weight={600} color={c.accent} tracking={0} tnum>
          {timer}
        </Txt>
      </View>
    </Pressable>
  );
}
