import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, PrimaryButton, Row } from '../components/surfaces';
import { Icon } from '../components/icon';
import { Figure } from '../figure/figure';
import { FIGURE_STRIPS } from '../figure/figure.generated';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { useAuth } from './auth';
import { AppleMark, GoogleMark } from './brand-marks';

/** The front strip: the same whole-body figure the Explore cards carry. */
const HERO = FIGURE_STRIPS[1]!;
/** The strip is cropped 200 wide by 717 tall; that ratio is never broken. */
const HERO_RATIO = 200 / 717;

/**
 * Not in the design exports — PLAN.md §3 lists onboarding as not yet designed
 * — so it is built out of the app's own parts: the layered body figure that
 * every exercise icon uses, the serif screen title, micro-caps labels, the
 * list rows from Profile, and the session screen's bottom control bar.
 *
 * OPEN (PLAN.md §8 #6): Apple and Google are drawn but not wired.
 */
export function SignIn() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { defaultEmail, signInWithEmail } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [note, setNote] = useState<string | null>(null);
  const { height } = useWindowDimensions();

  // The figure takes the space the form leaves, within sane bounds on any phone.
  const heroHeight = Math.round(Math.min(380, Math.max(200, height * 0.4)));
  const heroWidth = Math.round(heroHeight * HERO_RATIO);

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
          flexGrow: 1,
          flexShrink: 1,
          justifyContent: 'center',
          paddingTop: insets.top + tokens.space[24],
          paddingHorizontal: tokens.space[24],
          paddingBottom: tokens.space[24],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: tokens.space[16] }}>
          <View style={{ flexGrow: 1, flexShrink: 1, paddingBottom: tokens.space[8] }}>
            <Txt variant="screenTitle" family="serif" weight={500}>
              Alke
            </Txt>
            <Txt variant="reportProse" family="serif" weight={400} style={{ marginTop: tokens.space[8] }}>
              Log your sets. See what to change.
            </Txt>
          </View>
          <Figure
            view={HERO.view}
            viewBox={HERO.viewBox}
            paint={HERO.paint}
            accent={HERO.accent}
            width={heroWidth}
            height={heroHeight}
            strokeWidth={HERO.strokeWidth}
          />
        </View>
      </View>

      {/* The session screen's bottom bar: a border-top and the controls under it. */}
      <View
        style={{
          flexShrink: 0,
          paddingTop: tokens.space[20],
          paddingHorizontal: tokens.space[24],
          paddingBottom: Math.max(tokens.space[24], insets.bottom),
          backgroundColor: c.bg,
          borderTopWidth: 1,
          borderTopColor: c.border,
          gap: tokens.space[12],
        }}
      >
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

        <PrimaryButton
          label="Continue"
          height={tokens.sizing.primaryButtonHeight.min}
          onPress={submit}
        />

        <Card padding={16}>
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

        <Txt variant="captionTight" color={c.textSecondary}>
          {note ?? 'Alke is for people aged 15 and over.'}
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
