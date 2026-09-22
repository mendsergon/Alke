import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, ScreenContainer } from 'react-native-screens';
import { ScrollViewMarker } from 'react-native-screens/experimental';
import { PrimaryButton } from '../components/surfaces';
import { SelectField } from '../components/select-field';
import { DateOfBirthField, type DatePart } from '../components/date-of-birth-field';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import {
  EMPTY_ACCOUNT,
  GENDER_OPTIONS,
  checkAccount,
  type Account,
  type AccountErrors,
} from '../account/account-fields';

/**
 * The account a `users` row is made of, asked for once, after a new address
 * has been verified. It is drawn on the same glass as the sign-in screen and
 * ends the same way — the gate releases and Home arrives exactly as it does
 * from Continue.
 *
 * The page is built from `design/rungs-ui.pdf`, "Join a gym": serif title,
 * one body line under it, a micro-caps eyebrow over each field, and the
 * primary button last. The fields are that sheet's "Buttons and inputs"
 * input — `surfaceRaised`, 12px radius, 2px accent border while focused.
 */
export function Register({ onDone }: { onDone: (account: Account) => void }) {
  const insets = useSafeAreaInsets();

  const [account, setAccount] = useState<Account>(EMPTY_ACCOUNT);
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

  const submit = () => {
    const found = checkAccount(account);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onDone(account);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* The scroll edge effect is a native property of a Screen, not a
          gradient we draw: `Screen` carries `topScrollEdgeEffect` and
          `ScrollViewMarker` points it at the ScrollView in its subtree. The
          gate is not a navigator, so the register brings its own Screen and
          gets the same `top: 'soft'` the tab screens get from the Stack in
          `app/_layout.tsx`. */}
      <ScreenContainer style={{ flexGrow: 1, flexShrink: 1 }}>
      <Screen
        activityState={2}
        style={{ flex: 1 }}
        scrollEdgeEffects={{ top: 'soft', bottom: 'hidden', left: 'automatic', right: 'automatic' }}
      >
      <ScrollViewMarker
        style={{ flexGrow: 1, flexShrink: 1 }}
        scrollEdgeEffects={{ top: 'soft', bottom: 'hidden', left: 'automatic', right: 'automatic' }}
      >
      <ScrollView
        style={{ flexGrow: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + tokens.space[24],
          paddingHorizontal: tokens.space[24],
          paddingBottom: tokens.space[24],
          gap: 22,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Txt variant="screenTitle" family="serif" weight={500} style={{ lineHeight: 36 }}>
            Tell Alke who you are
          </Txt>
        </View>

        <Labelled label="Name" error={errors.name}>
          <Entry
            value={account.name}
            onChangeText={(v) => set('name', v)}
            placeholder="Ελένη"
            label="Name"
            focused={focused === 'name'}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
          />
        </Labelled>

        <Labelled label="Surname" error={errors.surname}>
          <Entry
            value={account.surname}
            onChangeText={(v) => set('surname', v)}
            placeholder="Papadopoulou"
            label="Surname"
            focused={focused === 'surname'}
            onFocus={() => setFocused('surname')}
            onBlur={() => setFocused(null)}
          />
        </Labelled>

        <Labelled label="Username" error={errors.username}>
          <Entry
            value={account.username}
            onChangeText={(v) => set('username', v)}
            placeholder="eleni"
            label="Username"
            autoCapitalize="none"
            focused={focused === 'username'}
            onFocus={() => setFocused('username')}
            onBlur={() => setFocused(null)}
          />
        </Labelled>

        {/* Four boxes on one line: the date's three, then gender. */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[12] }}>
          <View style={{ flexGrow: 3, flexBasis: 0 }}>
            <Labelled label="Date of birth" error={errors.dateOfBirth}>
              <DateOfBirthField
                value={account.dateOfBirth}
                open={openList === 'gender' ? null : openList}
                onToggle={(part) => setOpenList((p) => (p === part ? null : part))}
                onChange={(next) => set('dateOfBirth', next)}
              />
            </Labelled>
          </View>
          <View style={{ flexGrow: 1.3, flexBasis: 0 }}>
            <Labelled label="Gender" error={errors.gender}>
              <SelectField
                align="center"
                accessibilityLabel="Gender"
                placeholder="Gender"
                value={account.gender}
                options={GENDER_OPTIONS}
                open={openList === 'gender'}
                onToggle={() => setOpenList((p) => (p === 'gender' ? null : 'gender'))}
                onSelect={(v) => set('gender', v as Account['gender'])}
              />
            </Labelled>
          </View>
        </View>

      </ScrollView>
      </ScrollViewMarker>
      </Screen>
      </ScreenContainer>

      {/* The design puts the primary action at the foot of the screen
          (`design/rungs-ui.pdf`, "Join a gym"). It stays there: opening a
          list scrolls the fields, it does not move the button. */}
      <View
        style={{
          paddingHorizontal: tokens.space[24],
          paddingTop: tokens.space[12],
          paddingBottom: Math.max(tokens.space[24], insets.bottom),
        }}
      >
        <PrimaryButton
          label="Start training"
          height={tokens.sizing.primaryButtonHeight.min}
          onPress={submit}
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
