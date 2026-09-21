import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, PrimaryButton, Row } from '../components/surfaces';
import { Icon } from '../components/icon';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from './auth';
import { AppleMark, GoogleMark } from './brand-marks';

/**
 * The mark: the rung's own language — a 6px fully-rounded stroke — bent once.
 * There is no logo file in the repo (assets/images/icon.png is still Expo's
 * stock placeholder), so this stands in until Stavros supplies one.
 */
function AlkeMark({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M10 36 24 14l14 22"
        stroke={color}
        strokeWidth={tokens.rung.trackHeight}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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
        <AlkeMark size={44} color={c.accent} />

        <Txt variant="screenTitle" family="serif" weight={500} style={{ marginTop: tokens.space[20] }}>
          Alke
        </Txt>
        <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: tokens.space[4] }}>
          Log your sets. See what to change.
        </Txt>

        {/* The one flexible gap. The header holds the top, the controls sit in
            the thumb zone, and the space between them is deliberate. */}
        <View style={{ flexGrow: 1, minHeight: tokens.space[32] }} />

        <View>
          <MicroCaps>Email</MicroCaps>
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
            placeholder="you@example.com"
            placeholderTextColor={c.textSecondary}
            accessibilityLabel="Email address"
            style={{
              marginTop: tokens.space[8],
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

        <Card padding={16} style={{ marginTop: tokens.space[12] }}>
          <ProviderRow
            first
            label="Continue with Apple"
            mark={<AppleMark size={19} color={c.text} />}
            onPress={() => setNote('Apple sign-in is not wired up yet.')}
          />
          <ProviderRow
            label="Continue with Google"
            mark={<GoogleMark size={18} />}
            onPress={() => setNote('Google sign-in is not wired up yet.')}
          />
        </Card>

        {note ? (
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: tokens.space[12] }}>
            {note}
          </Txt>
        ) : null}

        <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: tokens.space[16] }}>
          Alke is for people aged 15 and over.
        </Txt>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Profile's settings row, with the vendor mark where the icon tile would be. */
function ProviderRow({
  label,
  mark,
  first,
  onPress,
}: {
  label: string;
  mark: ReactNode;
  first?: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Row first={first} paddingVertical={11}>
        <View style={{ width: 24, alignItems: 'center' }}>{mark}</View>
        <Txt variant="rowLabel" weight={500} style={{ flexGrow: 1, flexShrink: 1 }}>
          {label}
        </Txt>
        <Icon name="chevronRight" size={18} color={c.textSecondary} />
      </Row>
    </Pressable>
  );
}
