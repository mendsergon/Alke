import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, Pill, SecondaryButton, Segmented } from '../../components/surfaces';
import { Icon, type IconName } from '../../components/icon';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useGym } from '../../gym/gym';
import { useAuth } from '../../auth/auth';

import {
  THEME_OPTIONS,
  UNIT_OPTIONS,
  type ThemePreference,
  type Units,
} from '../../account/account-fields';

/**
 * Profile, drawn as `design/rungs-ui.pdf` draws it (page 13 light, page 27
 * dark): the person at the top as a card of their own, then one card per
 * thing they own — where they train, what they pay for, how the app behaves,
 * and the way out — with 12pt of ground between them, which is the gap
 * measured off page 13.
 *
 * Every row carries its mark in the 40pt tile the design gives the gym row,
 * and every row names the thing first and explains it quietly underneath,
 * the way that page sets "Northgate Strength Hall / Dover Row · 34 machines
 * on file".
 */
export default function Profile() {
  const { c, preference, setPreference } = useTheme();
  const { gym } = useGym();
  const router = useRouter();
  const { account, saveAccount, signOut } = useAuth();

  // What is shown is what is stored. Tapping writes the column and the row
  // that comes back is what the controls read, so nothing here is a setting
  // that only this phone knows about.
  const units = (account?.units as Units | undefined) ?? 'kg';

  // Everything the card shows is a column, read straight off the row.
  const fullName = [account?.name, account?.surname].filter(Boolean).join(' ');
  const initials = [account?.name, account?.surname]
    .filter(Boolean)
    .map((part) => part!.charAt(0).toUpperCase())
    .join('');
  const storedTheme = account?.theme as ThemePreference | undefined;
  const premium = account?.subscription_status === 'premium';

  // The app opens in the theme the account chose.
  useEffect(() => {
    if (storedTheme && storedTheme !== preference) setPreference(storedTheme);
    // Only when the stored value changes: this follows the account, not the
    // control.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedTheme]);

  return (
    <Screen gap={tokens.space[12]}>
      <ScreenHeader title="Profile" subtitle="Account, gyms, subscription" />

      {/* The person, as their own card — the design opens the screen with it. */}
      <Card>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account"
          onPress={() => router.push('/account')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[16] }}
        >
          <View
            style={{
              width: AVATAR,
              height: AVATAR,
              borderRadius: tokens.radius.rung,
              backgroundColor: initials ? c.accentSoft : c.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {initials ? (
              <Txt variant="avatarInitials" color={c.accent}>
                {initials}
              </Txt>
            ) : (
              <Icon name="person" size={22} color={c.textSecondary} />
            )}
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <Txt variant="nameTitle">{fullName || 'Account'}</Txt>
            {account ? (
              <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
                {account.username} · {account.email}
              </Txt>
            ) : null}
          </View>
          <Icon name="chevronRight" size={20} color={c.textSecondary} />
        </Pressable>
      </Card>

      {/* Where they train. */}
      <Card>
        <MicroCaps color={gym ? c.accent : c.textSecondary}>Active gym</MicroCaps>
        <View style={{ marginTop: tokens.space[12] }}>
          <IconRow
            icon="gym"
            tone={gym ? 'accent' : 'quiet'}
            title={gym ? gym.name : 'No gym'}
            detail={gym ? `${gym.place} · ${gym.machines} machines on file` : 'Not joined'}
            muted={!gym}
          />
        </View>
        <View style={{ marginTop: tokens.space[16] }}>
          <SecondaryButton
            label="Join a gym with a code or QR"
            icon="qr"
            height={48}
            onPress={() => router.push('/join-gym')}
          />
        </View>
      </Card>

      {/* What they pay for. */}
      <Card>
        <MicroCaps color={premium ? c.accent : c.textSecondary}>Subscription</MicroCaps>
        <View style={{ marginTop: tokens.space[12] }}>
          <IconRow
            icon="diamond"
            tone={premium ? 'accent' : 'quiet'}
            title={premium ? 'Premium' : 'Free'}
            trailing={<Pill label="Current" tone="neutral" />}
          />
        </View>
      </Card>

      {/* How the app behaves. */}
      <Card>
        <ControlRow icon="barbell" label="Units" first>
          <Segmented
            options={UNIT_OPTIONS}
            value={units}
            onChange={(next) => void saveAccount({ units: next })}
          />
        </ControlRow>
        <ControlRow icon="contrast" label="Theme">
          <Segmented
            options={THEME_OPTIONS}
            value={storedTheme ?? preference}
            onChange={(next) => {
              // Answer the tap now, keep it on the server after.
              setPreference(next);
              void saveAccount({ theme: next });
            }}
          />
        </ControlRow>
      </Card>

      {/* The way out. */}
      <Card>
        <Pressable
          accessibilityRole="button"
          onPress={signOut}
          style={{ flexDirection: 'row', alignItems: 'center', gap: GUTTER }}
        >
          <Tile icon="signOut" tone="destructive" />
          <Txt variant="rowTitle" weight={600} tracking={0} color={c.destructive}>
            Sign out
          </Txt>
        </Pressable>
      </Card>
    </Screen>
  );
}

/** The design's avatar on page 13: 48pt, `accentSoft`, initials in accent. */
const AVATAR = 48;

/** The mark's tile, as page 13 sets the gym's: 40pt, the button radius, `bg`. */
const TILE = 40;

/** Tile to text. Everything a row says lines up on this column. */
const GUTTER = tokens.space[16];

function Tile({ icon, tone }: { icon: IconName; tone: 'accent' | 'quiet' | 'destructive' }) {
  const { c } = useTheme();
  const ink =
    tone === 'accent' ? c.accent : tone === 'destructive' ? c.destructive : c.textSecondary;
  return (
    <View
      style={{
        width: TILE,
        height: TILE,
        borderRadius: tokens.radius.button,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={20} color={ink} />
    </View>
  );
}

/**
 * The design's row: the mark, the thing itself, and the quiet line under it
 * that says what it is. Anything on the right sits after both.
 */
function IconRow({
  icon,
  tone,
  title,
  detail,
  trailing,
  muted = false,
}: {
  icon: IconName;
  tone: 'accent' | 'quiet';
  title: string;
  detail?: string;
  trailing?: React.ReactNode;
  /** Nothing is set here yet, so the title is as quiet as its own line. */
  muted?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: GUTTER }}>
      <Tile icon={icon} tone={tone} />
      <View style={{ flexGrow: 1, flexShrink: 1 }}>
        <Txt
          variant="rowTitle"
          weight={600}
          tracking={0}
          color={muted ? c.textSecondary : c.text}
        >
          {title}
        </Txt>
        {detail ? (
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
            {detail}
          </Txt>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

/**
 * The same row where the value is a control rather than a word: the mark and
 * the label on one line, the control across the card beneath it, divided from
 * the row above by the card's own hairline.
 */
function ControlRow({
  icon,
  label,
  children,
  first,
}: {
  icon: IconName;
  label: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        paddingTop: first ? 0 : tokens.space[16],
        marginTop: first ? 0 : tokens.space[16],
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: GUTTER }}>
        <Tile icon={icon} tone="quiet" />
        <Txt variant="rowTitle" weight={600} tracking={0}>
          {label}
        </Txt>
      </View>
      <View style={{ marginTop: tokens.space[12] }}>{children}</View>
    </View>
  );
}
