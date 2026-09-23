import { Pressable, ScrollView, View } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/surfaces';
import { Icon } from '../components/icon';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from '../auth/auth';
import { readableDate } from '../account/account-fields';

/**
 * The account, after it exists: every column of the person's row in `users`,
 * shown exactly as the server holds it.
 *
 * `design/rungs-ui.pdf` page 29 states the rule this screen has to clear —
 * "no screen in the app is a stack of undifferentiated rows on an
 * undifferentiated background" — and page 01 gives the devices that clear it:
 * a hero card with the name set in the serif, bands of labelled values
 * standing on the bare ground with no surface under them at all, and an
 * accent-soft card for the one thing that is not like the others. Same page
 * says nothing in the app needs a stock icon set, so there are none here; the
 * micro-caps label is what names a value.
 *
 * It reads and never writes. These are settled at registration, where every
 * rule `users` enforces is checked.
 */
export default function AccountScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { account } = useAuth();

  const fullName = [account?.name, account?.surname].filter(Boolean).join(' ');
  const initials = [account?.name, account?.surname]
    .filter(Boolean)
    .map((part) => part!.charAt(0).toUpperCase())
    .join('');

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* The native bar's frame takes every touch inside it, which left the
          top of the back bubble dead; hidden here, the bubble answers
          everywhere and the swipe back still works. */}
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={{ flexGrow: 1 }}
        contentContainerStyle={{
          // Clears the bubble, which floats above rather than sitting in a
          // bar: glass only reads when something is passing under it.
          paddingTop: insets.top + tokens.space[20] + tokens.sizing.tapTarget.ios + tokens.space[16],
          paddingHorizontal: tokens.space[24],
          paddingBottom: Math.max(tokens.space[24], insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Txt variant="screenTitle" family="serif" weight={500} style={{ lineHeight: 36 }}>
          Account
        </Txt>
        <Txt variant="bodySmall" color={c.textSecondary} style={{ marginTop: tokens.space[8] }}>
          What Alke knows about you.
        </Txt>

        {account ? (
          <>
            {/* The hero: the person, named in the serif, the way page 01
                names the session it is about. */}
            <Card style={{ marginTop: tokens.space[20] }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: tokens.space[16],
                }}
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
                    <Icon name="person" size={24} color={c.textSecondary} />
                  )}
                </View>
                <View style={{ flexGrow: 1, flexShrink: 1 }}>
                  <Txt variant="section" family="serif" weight={500} numberOfLines={1}>
                    {fullName || 'Account'}
                  </Txt>
                </View>
              </View>
            </Card>

            {/* Page 01's stat band: labelled values standing on the ground,
                with nothing drawn under them. */}
            <Band>
              <Value label="Name" value={account.name} />
              <Value label="Surname" value={account.surname} />
              <Value label="Username" value={account.username} />
            </Band>
            <Band>
              <Value label="Born" value={readableDate(account.date_of_birth) ?? ''} tnum />
              <Value label="Gender" value={account.gender} />
            </Band>

            {/* The address is not like the others — it is the way in. */}
            <Card tone="accentSoft" style={{ marginTop: tokens.space[24] }}>
              <MicroCaps color={c.accent}>Email</MicroCaps>
              <Txt
                variant="dataValue"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ marginTop: tokens.space[8] }}
              >
                {account.email}
              </Txt>
            </Card>

            <Txt
              variant="captionTight"
              color={c.textSecondary}
              style={{ marginTop: tokens.space[16] }}
            >
              Set when you registered. They cannot be changed here.
            </Txt>
          </>
        ) : (
          <Card style={{ marginTop: tokens.space[20] }}>
            <Txt variant="bodySmall" color={c.textSecondary}>
              This device is not signed in to an account.
            </Txt>
          </Card>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + tokens.space[20],
          left: tokens.space[20],
        }}
      >
        <BackBubble />
      </Pressable>
    </View>
  );
}

/**
 * Back, as a glass bubble.
 *
 * `expo-glass-effect@57.0.3` wraps UIVisualEffectView's UIGlassEffect
 * (`ios/GlassView.swift`). `colorScheme` is given the app's own scheme, not
 * the phone's, because Alke carries its own theme — which is the case that
 * prop exists for (`GlassView.types.d.ts`) — and `isInteractive` is what
 * makes the lens answer a finger the way the system's own buttons do.
 */
function BackBubble() {
  const { c, scheme } = useTheme();
  const size = tokens.sizing.tapTarget.ios;
  return (
    <GlassView
      glassEffectStyle="regular"
      isInteractive
      colorScheme={scheme}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="chevronLeft" size={22} color={c.text} width={1.6} />
    </GlassView>
  );
}

/** The design's avatar disc, one step up because this screen is the account. */
const AVATAR = 56;

/** A row of values on the bare ground, as page 01 sets "THIS WEEK". */
function Band({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: tokens.space[20],
        marginTop: tokens.space[20],
      }}
    >
      {children}
    </View>
  );
}

/** One labelled value: the micro-caps name of it, then the thing itself. */
function Value({ label, value, tnum }: { label: string; value: string; tnum?: boolean }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 0 }}>
      <MicroCaps>{label}</MicroCaps>
      <Txt
        variant="dataValue"
        tnum={tnum}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ marginTop: tokens.space[8] }}
      >
        {value}
      </Txt>
    </View>
  );
}
