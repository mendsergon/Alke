import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlkeMark } from '../components/alke-mark';
import { PrimaryButton } from '../components/surfaces';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';

/**
 * The address is one Alke already knows, so this is a sign-in and all that is
 * left is the password.
 *
 * Same sheet of glass, same shape as the address face — the mark, one field,
 * one button. The input is the design's ("Buttons and inputs"): raised, 12px
 * radius, a 2px accent edge while it is focused.
 */
export function Password({
  active,
  email,
  onSignIn,
}: {
  active: boolean;
  email: string;
  onSignIn: (password: string) => Promise<boolean>;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const field = useRef<TextInput>(null);

  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);
  const [trying, setTrying] = useState(false);

  // The keyboard is already up when the glass turns: there is one thing to do
  // here and nobody should have to tap the field to start doing it.
  useEffect(() => {
    if (!active) {
      setPassword('');
      setWrong(null);
      return;
    }
    const focus = setTimeout(() => field.current?.focus(), 360);
    return () => clearTimeout(focus);
  }, [active]);

  const submit = async () => {
    if (trying || password.length === 0) return;
    setTrying(true);
    setWrong(null);
    const signedIn = await onSignIn(password);
    setTrying(false);
    if (!signedIn) setWrong('That password does not match.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
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
        <View style={{ flexGrow: 3 }} />

        <View style={{ alignItems: 'center' }}>
          <AlkeMark size={72} />
          <Txt
            variant="screenTitle"
            family="serif"
            weight={500}
            style={{ marginTop: tokens.space[16] }}
          >
            Welcome back
          </Txt>
          <Txt
            variant="captionTight"
            color={c.textSecondary}
            style={{ marginTop: tokens.space[4] }}
          >
            {email}
          </Txt>
        </View>

        <View style={{ marginTop: tokens.space[32] }}>
          <View style={{ marginBottom: 10 }}>
            <MicroCaps>Password</MicroCaps>
          </View>
          <TextInput
            ref={field}
            value={password}
            onChangeText={(next) => {
              setPassword(next);
              setWrong(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={submit}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect={false}
            returnKeyType="go"
            accessibilityLabel="Password"
            style={{
              height: 52,
              paddingHorizontal: 14,
              borderRadius: tokens.radius.button,
              backgroundColor: focused ? c.surfaceRaised : c.surface,
              borderWidth: focused ? 2 : 1,
              borderColor: focused ? c.accent : wrong ? c.destructive : c.border,
              color: c.text,
              fontFamily: tokens.fontFamily.sansRegular,
              fontSize: tokens.type.body.size,
            }}
          />
          <View
            style={{
              height: tokens.type.captionTight.lineHeight,
              marginTop: tokens.space[4],
              justifyContent: 'center',
            }}
          >
            {wrong ? (
              <Txt variant="captionTight" color={c.destructive} accessibilityLiveRegion="polite">
                {wrong}
              </Txt>
            ) : null}
          </View>
        </View>

        <View style={{ marginTop: tokens.space[8] }}>
          <PrimaryButton
            label={trying ? 'Signing in' : 'Sign in'}
            height={tokens.sizing.primaryButtonHeight.min}
            onPress={submit}
          />
        </View>

        <View style={{ flexGrow: 2 }} />
      </View>
    </KeyboardAvoidingView>
  );
}
