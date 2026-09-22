import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/surfaces';
import { SelectField } from '../components/select-field';
import { DateOfBirthField, type DatePart } from '../components/date-of-birth-field';
import { Icon } from '../components/icon';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from '../auth/auth';
import {
  EMPTY_ACCOUNT,
  GENDER_OPTIONS,
  checkAccount,
  type Account,
  type AccountErrors,
} from '../account/account-fields';

/**
 * The account, after it exists. It is the same fields the register page asks
 * for, in the same shape — the design gives the account one entry, the
 * identity card at the top of Profile (`design/rungs-ui.pdf`, Profile), and
 * this is what that chevron opens.
 */
export default function AccountScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [account, setAccount] = useState<Account>({
    ...EMPTY_ACCOUNT,
    name: user?.name ?? '',
    username: user?.email ?? '',
  });
  const [errors, setErrors] = useState<AccountErrors>({});
  const [openList, setOpenList] = useState<DatePart | 'gender' | null>(null);
  const [focused, setFocused] = useState<keyof Account | null>(null);

  const set = <K extends keyof Account>(key: K, value: Account[K]) => {
    setAccount((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const save = () => {
    const found = checkAccount(account);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        keyboardShouldPersistTaps="handled"
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

        <Labelled label="Name" error={errors.name}>
          <Entry
            label="Name"
            value={account.name}
            onChangeText={(v) => set('name', v)}
            placeholder="Ελένη"
            focused={focused === 'name'}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
          />
        </Labelled>

        <Labelled label="Surname" error={errors.surname}>
          <Entry
            label="Surname"
            value={account.surname}
            onChangeText={(v) => set('surname', v)}
            placeholder="Papadopoulou"
            focused={focused === 'surname'}
            onFocus={() => setFocused('surname')}
            onBlur={() => setFocused(null)}
          />
        </Labelled>

        <Labelled label="Username" error={errors.username}>
          <Entry
            label="Username"
            value={account.username}
            onChangeText={(v) => set('username', v)}
            placeholder="eleni"
            autoCapitalize="none"
            focused={focused === 'username'}
            onFocus={() => setFocused('username')}
            onBlur={() => setFocused(null)}
          />
        </Labelled>

        <Labelled label="Date of birth" error={errors.dateOfBirth}>
          <DateOfBirthField
            value={account.dateOfBirth}
            open={openList === 'gender' ? null : openList}
            onToggle={(part) => setOpenList((p) => (p === part ? null : part))}
            onChange={(next) => set('dateOfBirth', next)}
          />
        </Labelled>

        <Labelled label="Gender" error={errors.gender}>
          <SelectField
            accessibilityLabel="Gender"
            placeholder="Choose"
            value={account.gender}
            options={GENDER_OPTIONS}
            open={openList === 'gender'}
            onToggle={() => setOpenList((p) => (p === 'gender' ? null : 'gender'))}
            onSelect={(v) => set('gender', v as Account['gender'])}
          />
        </Labelled>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: tokens.space[24],
          paddingTop: tokens.space[12],
          paddingBottom: Math.max(tokens.space[24], insets.bottom),
        }}
      >
        <PrimaryButton
          label="Save"
          height={tokens.sizing.primaryButtonHeight.min}
          onPress={save}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

/** A micro-caps eyebrow, the field, and one reserved line for the rule it broke. */
function Labelled({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
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
      >
        {error ? (
          <Txt variant="captionTight" color={c.destructive} accessibilityLiveRegion="polite">
            {error}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

/** The design's input: `surfaceRaised`, 12px radius, 2px accent border focused. */
function Entry({
  value,
  onChangeText,
  placeholder,
  label,
  focused,
  onFocus,
  onBlur,
  autoCapitalize = 'words',
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  label: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  autoCapitalize?: 'none' | 'words';
}) {
  const { c } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      placeholderTextColor={c.textSecondary}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      accessibilityLabel={label}
      style={{
        height: 52,
        paddingHorizontal: 14,
        borderRadius: tokens.radius.button,
        backgroundColor: focused ? c.surfaceRaised : c.surface,
        borderWidth: focused ? 2 : 1,
        borderColor: focused ? c.accent : c.border,
        color: c.text,
        fontFamily: tokens.fontFamily.sansRegular,
        fontSize: tokens.type.body.size,
      }}
    />
  );
}
