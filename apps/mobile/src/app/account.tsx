import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/surfaces';
import { Icon, type IconName } from '../components/icon';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from '../auth/auth';
import { PersonAvatar } from '../figure/person';
import { readableDate, type Gender } from '../account/account-fields';

/**
 * The account, after it exists: every column of the person's row in `users`,
 * shown exactly as the server holds it.
 *
 * Drawn the way `design/rungs-ui.pdf` draws a settings screen (page 13, page
 * 27): the person on a card of their own at the top, then one card per group
 * of columns, each opened by a micro-caps eyebrow, each row carrying its mark
 * in the 40pt tile the design gives the gym row, the column's name quiet and
 * what is in it heavier.
 *
 * It reads and never writes. These are settled at registration, where every
 * rule `users` enforces is checked.
 */
export default function AccountScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { account } = useAuth();

  const gender = (account?.gender ?? '') as Gender | '';
  const fullName = [account?.name, account?.surname].filter(Boolean).join(' ');

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + tokens.space[20], paddingHorizontal: tokens.space[20] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={{ width: 44, height: 44, justifyContent: 'center' }}
        >
          <Icon name="chevronLeft" size={24} color={c.textSecondary} width={1.5} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flexGrow: 1 }}
        contentContainerStyle={{
          paddingTop: tokens.space[12],
          paddingHorizontal: tokens.space[24],
          paddingBottom: Math.max(tokens.space[24], insets.bottom),
          gap: tokens.space[12],
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: tokens.space[4] }}>
          <Txt variant="screenTitle" family="serif" weight={500} style={{ lineHeight: 36 }}>
            Account
          </Txt>
          <Txt variant="bodySmall" color={c.textSecondary} style={{ marginTop: tokens.space[8] }}>
            What Alke knows about you. A gym never sees any of it.
          </Txt>
        </View>

        {account ? (
          <>
            {/* The person, as their own card. */}
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.space[16] }}>
                <PersonAvatar gender={gender} size={AVATAR} />
                <View style={{ flexGrow: 1, flexShrink: 1 }}>
                  <Txt variant="nameTitle">{fullName || 'Account'}</Txt>
                  <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
                    {account.username}
                  </Txt>
                </View>
              </View>
            </Card>

            <Group eyebrow="Name">
              <StoredRow icon="person" label="Name" value={account.name} first />
              <StoredRow icon="users" label="Surname" value={account.surname} />
              <StoredRow icon="at" label="Username" value={account.username} />
            </Group>

            <Group eyebrow="About you">
              <StoredRow
                icon="calendar"
                label="Date of birth"
                value={readableDate(account.date_of_birth) ?? ''}
                first
              />
              <StoredRow icon="body" label="Gender" value={account.gender} />
            </Group>

            <Group eyebrow="Sign-in">
              <StoredRow icon="mail" label="Email" value={account.email} first />
            </Group>

            <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: tokens.space[4] }}>
              Set when you registered. They cannot be changed here.
            </Txt>
          </>
        ) : (
          <Card>
            <Txt variant="bodySmall" color={c.textSecondary}>
              This device is not signed in to an account.
            </Txt>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/** The design's avatar on page 13, one step up because this screen is its own. */
const AVATAR = 56;

/** The mark's tile, as page 13 sets the gym's: 40pt, the button radius, `bg`. */
const TILE = 40;

/** Tile to text. Everything a row says lines up on this column. */
const GUTTER = tokens.space[16];

/** A card of rows under a micro-caps eyebrow, the way page 13 opens a group. */
function Group({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <Card>
      <MicroCaps>{eyebrow}</MicroCaps>
      <View style={{ marginTop: tokens.space[12] }}>{children}</View>
    </Card>
  );
}

/**
 * One column: its mark, its name quiet on the left, and what is stored in it
 * heavier on the right. An empty column keeps its line and says nothing.
 */
function StoredRow({
  icon,
  label,
  value,
  first,
}: {
  icon: IconName;
  label: string;
  value: string;
  first?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: GUTTER,
        paddingTop: first ? 0 : tokens.space[12],
        marginTop: first ? 0 : tokens.space[12],
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.border,
      }}
    >
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
        <Icon name={icon} size={20} color={c.textSecondary} />
      </View>
      <Txt variant="captionTight" color={c.textSecondary}>
        {label}
      </Txt>
      <Txt
        variant="rowTitle"
        weight={600}
        tracking={0}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ flexGrow: 1, flexShrink: 1, textAlign: 'right' }}
      >
        {value}
      </Txt>
    </View>
  );
}
