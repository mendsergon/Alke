import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Orb } from '../components/orb';
import { SecondaryButton } from '../components/surfaces';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';

/**
 * The wait between giving an address and owning an account. The link is out;
 * nothing happens here until it is opened, so the screen only waits and lets
 * the link be sent again.
 *
 * Drawn on the gate's glass in the same shape as `design/rungs-ui.pdf`,
 * "Join a gym" — serif title, one body line, the action last. The orb is the
 * app's own waiting mark.
 *
 * OPEN: nothing can tell this screen the address was confirmed yet. PocketBase
 * v0.40.4 sends the mail and flips `users.verified`; until the client watches
 * that record, the five-second timer below stands in for the event.
 */
export function VerifyEmail({
  active,
  email,
  onConfirmed,
  onResend,
}: {
  /**
   * All three faces of the gate stay mounted so they can cross-fade, so the
   * wait cannot start on mount — it starts when this face is the one showing.
   */
  active: boolean;
  email: string;
  onConfirmed: () => void;
  onResend: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!active) {
      setConfirmed(false);
      return;
    }
    const arrives = setTimeout(() => setConfirmed(true), CONFIRM_AFTER);
    return () => clearTimeout(arrives);
  }, [active]);

  // The orb settles into the accent, holds it long enough to be read, and
  // only then does the glass turn over to the account.
  useEffect(() => {
    if (!active || !confirmed) return;
    const moveOn = setTimeout(onConfirmed, HOLD_CONFIRMED);
    return () => clearTimeout(moveOn);
  }, [active, confirmed, onConfirmed]);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + tokens.space[24],
        paddingHorizontal: tokens.space[24],
        paddingBottom: Math.max(tokens.space[24], insets.bottom),
      }}
    >
      <View style={{ flexGrow: 3 }} />

      <View style={{ alignItems: 'center' }}>
        <Orb
          mood={confirmed ? 'idle' : 'thinking'}
          size={72}
          ink={confirmed ? c.accent : undefined}
        />
        <Txt
          variant="screenTitle"
          family="serif"
          weight={500}
          style={{ marginTop: tokens.space[20], textAlign: 'center', lineHeight: 36 }}
        >
          {confirmed ? 'Confirmed' : 'Check your email'}
        </Txt>
        <Txt
          variant="bodySmall"
          color={confirmed ? c.accent : c.textSecondary}
          style={{ marginTop: tokens.space[8], textAlign: 'center' }}
        >
          {confirmed
            ? `${email} is yours.`
            : `A link is on its way to ${email}. Open it and this screen moves on by itself.`}
        </Txt>
      </View>

      <View style={{ marginTop: tokens.space[32] }}>
        <SecondaryButton
          label="Send the link again"
          height={52}
          disabled={confirmed}
          onPress={onResend}
        />
      </View>

      <View style={{ flexGrow: 2 }} />
    </View>
  );
}

/** How long the link is waited for, and how long "Confirmed" is held. */
const CONFIRM_AFTER = 5000;
const HOLD_CONFIRMED = 1100;
