import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelectField } from '../components/select-field';
import { DateOfBirthField } from '../components/date-of-birth-field';
import { Icon } from '../components/icon';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from '../auth/auth';
import { EMPTY_ACCOUNT, GENDER_OPTIONS, fromIsoDate } from '../account/account-fields';

/**
 * The account, after it exists. It is the same fields the register page asks
 * for, in the same shape — the design gives the account one entry, the
 * identity card at the top of Profile (`design/rungs-ui.pdf`, Profile), and
 * this is what that chevron opens.
 *
 * Every box shows its column from the row, and nothing here writes: the
 * fields are settled at registration, where the rules `users` enforces are
 * checked, so the boxes are filled and inert.
 */
export default function AccountScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { account } = useAuth();

  const name = account?.name ?? '';
  const surname = account?.surname ?? '';
  const username = account?.username ?? '';
  const gender = account?.gender ?? '';
  const dateOfBirth =
    (account ? fromIsoDate(account.date_of_birth) : null) ?? EMPTY_ACCOUNT.dateOfBirth;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20 }}>
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
          paddingTop: 12,
          paddingHorizontal: 24,
          paddingBottom: tokens.space[24],
          gap: 22,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Txt variant="screenTitle" family="serif" weight={500} style={{ lineHeight: 36 }}>
            Account
          </Txt>
          <Txt variant="bodySmall" color={c.textSecondary} style={{ marginTop: 8 }}>
            What Alke knows about you. A gym never sees any of it.
          </Txt>
        </View>

        <Labelled label="Name">
          <Entry label="Name" value={name} />
        </Labelled>

        <Labelled label="Surname">
          <Entry label="Surname" value={surname} />
        </Labelled>

        <Labelled label="Username">
          <Entry label="Username" value={username} />
        </Labelled>

        {/* Four boxes on one line: the date's three, then gender. */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[12] }}>
          <View style={{ flexGrow: 3, flexBasis: 0 }}>
            <Labelled label="Date of birth">
              {/* Filled and shut. The lists are what change a value, so they
                  never come down. */}
              <View pointerEvents="none">
                <DateOfBirthField
                  value={dateOfBirth}
                  open={null}
                  onToggle={noop}
                  onChange={noop}
                />
              </View>
            </Labelled>
          </View>
          <View style={{ flexGrow: 1.3, flexBasis: 0 }}>
            <Labelled label="Gender">
              <View pointerEvents="none">
                <SelectField
                  align="center"
                  accessibilityLabel="Gender"
                  placeholder="Gender"
                  value={gender}
                  options={GENDER_OPTIONS}
                  open={false}
                  onToggle={noop}
                  onSelect={noop}
                />
              </View>
            </Labelled>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Nothing on this screen changes anything. */
function noop() {}

/** A micro-caps eyebrow, the field, and one reserved line for the rule it broke. */
function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={{ marginBottom: 10 }}>
        <MicroCaps>{label}</MicroCaps>
      </View>
      {children}
      <View
        style={{
          height: tokens.type.captionTight.lineHeight,
          marginTop: tokens.space[4],
          justifyContent: 'center',
        }}
      />
    </View>
  );
}

/** The design's input: `surfaceRaised`, 12px radius, 2px accent border focused. */
function Entry({ value, label }: { value: string; label: string }) {
  const { c } = useTheme();
  return (
    <TextInput
      value={value}
      editable={false}
      accessibilityLabel={label}
      style={{
        height: 52,
        paddingHorizontal: 14,
        borderRadius: tokens.radius.button,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        color: c.text,
        fontFamily: tokens.fontFamily.sansRegular,
        fontSize: tokens.type.body.size,
      }}
    />
  );
}
