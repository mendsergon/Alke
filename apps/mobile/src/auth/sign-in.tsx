import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlkeMark } from '../components/alke-mark';
import { PrimaryButton } from '../components/surfaces';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from './auth';
import { AppleMark, GoogleMark } from './brand-marks';

/**
 * Not in the design exports — PLAN.md §3 lists onboarding as not yet designed.
 * Kept minimal: the mark, the wordmark, one field, one button, two rows.
 *
 * OPEN (PLAN.md §8 #6): Apple and Google are drawn but not wired.
 */
export function SignIn() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { defaultEmail, signInWithEmail } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [note, setNote] = useState<string | null>(null);

  const submit = () => {
    if (email.trim().length > 0) signInWithEmail(email);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + tokens.space[24],
          paddingHorizontal: tokens.space[24],
          paddingBottom: Math.max(tokens.space[24], insets.bottom),
        }}
      >
        {/* Weighted so the whole group sits below centre, not against the top. */}
        <View style={{ flexGrow: 3 }} />

        <View style={{ alignItems: 'center' }}>
          <AlkeMark size={104} />
          <Txt
            variant="screenTitle"
            family="serif"
            weight={500}
            style={{ marginTop: tokens.space[16] }}
          >
            Alke
          </Txt>
          {/* PLAN.md §1.5 — low volume, high effort — and §3, every rung has
              a target. The line states the product's position, not a slogan. */}
          <Txt
            variant="captionTight"
            color={c.textSecondary}
            style={{ marginTop: tokens.space[4] }}
          >
            Low volume. High effort. Every set measured.
          </Txt>
        </View>

        <View style={{ marginTop: tokens.space[32] }}>
          <TextInput
            value={email}
            onChangeText={(next) => {
              setEmail(next);
              setNote(null);
            }}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            inputMode="email"
            returnKeyType="go"
            onSubmitEditing={submit}
            placeholder="Email"
            placeholderTextColor={c.textSecondary}
            accessibilityLabel="Email address"
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
        </View>

        <View style={{ marginTop: tokens.space[12] }}>
          <PrimaryButton
            label="Continue"
            height={tokens.sizing.primaryButtonHeight.min}
            onPress={submit}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.space[12],
            marginVertical: tokens.space[20],
          }}
        >
          <View style={{ flexGrow: 1, height: 1, backgroundColor: c.border }} />
          <Txt variant="captionTight" color={c.textSecondary}>
            or
          </Txt>
          <View style={{ flexGrow: 1, height: 1, backgroundColor: c.border }} />
        </View>

        <View style={{ gap: tokens.space[12] }}>
          <ProviderButton
            label="Continue with Apple"
            mark={<AppleMark size={19} color={c.text} />}
            onPress={() => setNote('Apple sign-in is not wired up yet.')}
          />
          <ProviderButton
            label="Continue with Google"
            mark={<GoogleMark size={18} />}
            onPress={() => setNote('Google sign-in is not wired up yet.')}
          />
        </View>

        {note ? (
          <Txt
            variant="captionTight"
            color={c.textSecondary}
            style={{ marginTop: tokens.space[12], textAlign: 'center' }}
          >
            {note}
          </Txt>
        ) : null}

        <View style={{ flexGrow: 2 }} />

      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * A provider button: separate, full width, the primary's height and radius,
 * with the mark and the label centred together. Apple's and Google's own
 * guidelines both put the mark immediately before centred label text.
 */
function ProviderButton({
  label,
  mark,
  onPress,
}: {
  label: string;
  mark: ReactNode;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        height: 52,
        borderRadius: tokens.radius.button,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.space[8],
      }}
    >
      {mark}
      <Txt variant="label" weight={500}>
        {label}
      </Txt>
    </Pressable>
  );
}
