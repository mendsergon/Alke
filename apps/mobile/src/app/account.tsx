import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/surfaces';
import { Icon } from '../components/icon';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from '../auth/auth';
import { readableDate } from '../account/account-fields';

/**
 * The account, after it exists: every column of the person's row in `users`,
 * shown exactly as the server holds it. The design gives the account one
 * entry, the identity card at the top of Profile (`design/rungs-ui.pdf`,
 * Profile), and this is what that chevron opens.
 *
 * It reads and never writes. Name, surname, username, address, date of birth
 * and gender are settled at registration, where every one of them is checked
 * against the rules `users` enforces; a second place to change them would be
 * a second place for the app and the collection to disagree. Units and theme
 * are not identity and stay editable, on Profile.
 */
export default function AccountScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { account } = useAuth();

  // Straight off the row, in the order the row was written. Nothing is
  // derived, defaulted or parsed — a column that is empty reads as empty
  // rather than as something invented to fill the line.
  const fields: { label: string; value: string }[] = account
    ? [
        { label: 'Name', value: account.name },
        { label: 'Surname', value: account.surname },
        { label: 'Username', value: account.username },
        { label: 'Email', value: account.email },
        { label: 'Date of birth', value: readableDate(account.date_of_birth) ?? '' },
        { label: 'Gender', value: account.gender },
        { label: 'Subscription', value: capitalise(account.subscription_status) },
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + tokens.space[20], paddingHorizontal: tokens.space[20] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={{
            width: tokens.sizing.tapTarget.ios,
            height: tokens.sizing.tapTarget.ios,
            justifyContent: 'center',
          }}
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
          gap: tokens.space[20],
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Txt variant="screenTitle" family="serif" weight={500} style={{ lineHeight: 36 }}>
            Account
          </Txt>
          <Txt variant="bodySmall" color={c.textSecondary} style={{ marginTop: tokens.space[8] }}>
            What Alke knows about you. A gym never sees any of it.
          </Txt>
        </View>

        {account ? (
          <View style={{ gap: tokens.space[12] }}>
            <Card padding={tokens.space[16]}>
              {fields.map((field, index) => (
                <Stored
                  key={field.label}
                  label={field.label}
                  value={field.value}
                  first={index === 0}
                />
              ))}
            </Card>
            <Txt variant="captionTight" color={c.textSecondary}>
              Set when you registered. They cannot be changed here.
            </Txt>
          </View>
        ) : (
          <Card padding={tokens.space[16]}>
            <Txt variant="bodySmall" color={c.textSecondary}>
              This device is not signed in to an account.
            </Txt>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

/** `free` as the row keeps it, `Free` as a person reads it. */
function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * One column: what it is on the left, what is in it on the right. An empty
 * column keeps its line and says nothing, so a gap in the row is visible as a
 * gap rather than hidden.
 */
function Stored({ label, value, first }: { label: string; value: string; first: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: tokens.space[16],
        paddingVertical: tokens.space[12],
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.border,
      }}
    >
      <Txt variant="bodySmall" color={c.textSecondary}>
        {label}
      </Txt>
      <Txt
        variant="rowLabel"
        weight={500}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ flexGrow: 1, flexShrink: 1, textAlign: 'right' }}
      >
        {value}
      </Txt>
    </View>
  );
}
