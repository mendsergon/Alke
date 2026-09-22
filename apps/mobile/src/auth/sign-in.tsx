import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlkeMark } from '../components/alke-mark';
import { PrimaryButton } from '../components/surfaces';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from './auth';
import { Register } from './register';
import { VerifyEmail } from './verify-email';
import { AppleMark, GoogleMark } from './brand-marks';

/**
 * Not in the design exports — PLAN.md §3 lists onboarding as not yet designed.
 * Kept minimal: the mark, the wordmark, one field, one button, two rows.
 *
 * OPEN (PLAN.md §8 #6): Apple and Google are drawn but not wired.
 */
export function SignIn({ onGlass = false }: { onGlass?: boolean } = {}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { defaultEmail, signInWithEmail } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** One sheet of glass, three faces: the address, the wait, the account. */
  const [step, setStep] = useState<'email' | 'verify' | 'register'>('email');
  const [focused, setFocused] = useState(false);

  const enter = (address: string) => {
    signInWithEmail(address);
    if (router.canGoBack()) router.back();
  };

  // Ben's is the account that already exists (PLAN.md §2, "Sign-in gate") and
  // goes straight in. Any other address is new, so it is asked to register.
  const submit = () => {
    if (email.trim().length === 0) {
      setError('That email is wrong.');
      return;
    }
    setError(null);
    // Ben's account already exists and goes straight in. A new address turns
    // the glass over to the wait, and the wait hands off to the register.
    if (email.toLowerCase().includes('ben')) {
      enter(email);
      return;
    }
    setStep('verify');
  };

  // The two faces cross-fade on the same sheet of glass, in the gate's own
  // language — nothing is pushed, nothing pops, nothing can be swiped away.
  const turn = useRef(new Animated.Value(0)).current;
  /**
   * Which faces are built. A face the gate has not reached yet is not worth
   * mounting — the register face alone is three lists and five fields, and it
   * was alive behind the address from launch. The face being left stays up
   * until the turn is over so the cross-fade has something to fade.
   */
  const [built, setBuilt] = useState<Set<string>>(() => new Set(['email']));
  useEffect(() => {
    setBuilt((prev) => (prev.has(step) ? prev : new Set(prev).add(step)));
    const settled = setTimeout(() => setBuilt(new Set([step])), TURN + 40);
    return () => clearTimeout(settled);
  }, [step]);

  useEffect(() => {
    Animated.timing(turn, {
      toValue: FACE_ORDER.indexOf(step),
      duration: TURN,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, turn]);

  const emailFace = (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: onGlass ? 'transparent' : c.bg }}
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
          {/* The export's own cover line, under the Rungs heading in
              design/rungs-ui.html. Not written here. */}
          <Txt
            variant="captionTight"
            color={c.textSecondary}
            style={{ marginTop: tokens.space[4] }}
          >
            A strength-training logger.
          </Txt>
        </View>

        <View style={{ marginTop: tokens.space[20] }}>
          {/* One caption line of height, reserved whether or not there is a
              message, so showing one moves nothing on the screen. It sits
              nearer the field than the line above it, because it belongs to
              the field. */}
          <View
            style={{
              height: tokens.type.captionTight.lineHeight,
              marginBottom: tokens.space[8],
              justifyContent: 'center',
            }}
          >
            {error ? (
              <Txt
                variant="captionTight"
                color={c.destructive}
                accessibilityLiveRegion="polite"
              >
                {error}
              </Txt>
            ) : null}
          </View>
          <TextInput
            value={email}
            onChangeText={(next) => {
              setEmail(next);
              setNote(null);
              setError(null);
            }}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            inputMode="email"
            returnKeyType="go"
            onSubmitEditing={submit}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Email"
            placeholderTextColor={c.textSecondary}
            accessibilityLabel="Email address"
            // The design's input, focused and at rest: `design/rungs-ui.pdf`,
            // "Buttons and inputs" draws it raised with a 2px accent edge.
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

  return (
    <View style={{ flex: 1, backgroundColor: onGlass ? 'transparent' : c.bg }}>
      <Face turn={turn} index={0} active={step === 'email'}>
        {built.has('email') ? emailFace : null}
      </Face>
      <Face turn={turn} index={1} active={step === 'verify'}>
        {built.has('verify') ? (
          <VerifyEmail
            active={step === 'verify'}
            email={email.trim()}
            onConfirmed={() => setStep('register')}
            onResend={() => setNote('The link is on its way again.')}
          />
        ) : null}
      </Face>
      <Face turn={turn} index={2} active={step === 'register'}>
        {built.has('register') ? <Register email={email.trim()} onDone={() => enter(email)} /> : null}
      </Face>
    </View>
  );
}

/** How long one face takes to become the next. */
const TURN = 340;

/** The three faces in the order the gate turns them over. */
const FACE_ORDER = ['email', 'verify', 'register'] as const;

/**
 * One face of the glass. Only the face the gate is on is opaque and takes
 * touches; its neighbours fade out and drop back by a breath as it comes up.
 */
function Face({
  turn,
  index,
  active,
  children,
}: {
  turn: Animated.Value;
  index: number;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Animated.View
      pointerEvents={active ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: turn.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          }),
          transform: [
            {
              scale: turn.interpolate({
                inputRange: [index - 1, index, index + 1],
                outputRange: [1.02, 1, 0.98],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
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
