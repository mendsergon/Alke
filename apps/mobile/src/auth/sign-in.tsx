import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/surfaces';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from './auth';

/**
 * The gate. It is not in the design exports — PLAN.md §3 lists onboarding as
 * not yet designed — so it is drawn only from the tokens the exports use:
 * the serif wordmark, one surface field, the 56px primary, quiet secondaries.
 *
 * OPEN (PLAN.md §8 #6): Apple and Google are placeholders. Real buttons must
 * follow each vendor's branding rules and sign in with PKCE (§5).
 */
export function SignIn() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { defaultEmail, signInWithEmail } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [note, setNote] = useState<string | null>(null);

  const canContinue = email.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + tokens.space[40],
          paddingHorizontal: tokens.space[24],
          paddingBottom: Math.max(tokens.space[24], insets.bottom),
        }}
      >
        {/* Placeholder: a way straight in while sign-in is not wired up. */}
        <ProviderButton label="Enter" onPress={() => signInWithEmail(defaultEmail)} />

        <View style={{ flexGrow: 1, justifyContent: 'center' }}>
          <Txt variant="screenTitle" family="serif" weight={500}>
            Alke
          </Txt>
          <Txt variant="body" color={c.textSecondary} style={{ marginTop: 6 }}>
            Sign in to pick up your log where you left it.
          </Txt>

          <View style={{ marginTop: tokens.space[32] }}>
            <Txt variant="captionTight" weight={500} color={c.textSecondary}>
              Email
            </Txt>
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
              onSubmitEditing={() => canContinue && signInWithEmail(email)}
              placeholder="you@example.com"
              placeholderTextColor={c.textSecondary}
              accessibilityLabel="Email address"
              style={{
                marginTop: 8,
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

          <View style={{ marginTop: tokens.space[16] }}>
            <PrimaryButton
              label="Continue"
              height={tokens.sizing.primaryButtonHeight.min}
              onPress={() => canContinue && signInWithEmail(email)}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: tokens.space[24] }}>
            <View style={{ flexGrow: 1, height: 1, backgroundColor: c.border }} />
            <Txt variant="captionTight" color={c.textSecondary}>
              or
            </Txt>
            <View style={{ flexGrow: 1, height: 1, backgroundColor: c.border }} />
          </View>

          <View style={{ gap: 10 }}>
            <ProviderButton label="Continue with Apple" onPress={() => setNote('Apple sign-in is not wired up yet.')} />
            <ProviderButton label="Continue with Google" onPress={() => setNote('Google sign-in is not wired up yet.')} />
          </View>

          {note ? (
            <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 12 }}>
              {note}
            </Txt>
          ) : null}
        </View>

        <Txt variant="captionTight" color={c.textSecondary} style={{ textAlign: 'center' }}>
          Alke is for people aged 15 and over.
        </Txt>
      </View>
    </KeyboardAvoidingView>
  );
}

/** A quiet full-width button: the export's secondary shape, no brand mark. */
function ProviderButton({ label, onPress }: { label: string; onPress: () => void }) {
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
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt variant="label" weight={500}>
        {label}
      </Txt>
    </Pressable>
  );
}
