import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, PrimaryButton, SecondaryButton } from '../components/surfaces';
import { Icon } from '../components/icon';
import { MicroCaps, Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';
import { MOCK_GYM, MOCK_GYM_CODE, MOCK_GYM_EQUIPMENT } from '../mock/mock-data';

const CODE_LENGTH = 6;

function CodeBoxes() {
  const { c } = useTheme();
  const chars = MOCK_GYM_CODE.split('');
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {Array.from({ length: CODE_LENGTH }, (_, i) => {
        const active = i === chars.length;
        return (
          <View
            key={i}
            style={{
              flexGrow: 1,
              flexBasis: 0,
              height: 62,
              borderRadius: tokens.radius.button,
              backgroundColor: c.surface,
              borderWidth: active ? 2 : 1,
              borderColor: active ? c.accent : c.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="codeChar" tnum>
              {chars[i] ?? ''}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

export default function JoinGym() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
        contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 24, gap: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Txt variant="screenTitle" family="serif" weight={500} style={{ lineHeight: 36 }}>
            Join a gym
          </Txt>
          <Txt variant="bodySmall" color={c.textSecondary} style={{ marginTop: 8 }}>
            Your gym&apos;s equipment list shapes every program the app builds for you.
          </Txt>
        </View>

        <View>
          <View style={{ marginBottom: 10 }}>
            <MicroCaps>Gym code</MicroCaps>
          </View>
          <CodeBoxes />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flexGrow: 1, height: 1, backgroundColor: c.border }} />
          <MicroCaps>or</MicroCaps>
          <View style={{ flexGrow: 1, height: 1, backgroundColor: c.border }} />
        </View>

        <SecondaryButton label="Scan the gym’s QR code" icon="qr" height={52} />

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: tokens.radius.button,
                backgroundColor: c.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="gym" size={22} color={c.accent} />
            </View>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Txt variant="rowTitle" weight={600}>
                {MOCK_GYM.name}
              </Txt>
              <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
                {MOCK_GYM.place} · {MOCK_GYM.members} members
              </Txt>
            </View>
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 9,
                borderRadius: tokens.radius.rung,
                backgroundColor: c.accentSoft,
              }}
            >
              <MicroCaps color={c.accent}>Match</MicroCaps>
            </View>
          </View>
          <View style={{ marginTop: 16, marginBottom: 10 }}>
            <MicroCaps>Equipment on file</MicroCaps>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {MOCK_GYM_EQUIPMENT.map((item) => (
              <View
                key={item}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 11,
                  borderRadius: tokens.radius.chip,
                  backgroundColor: c.bg,
                }}
              >
                <Txt variant="captionTight" color={c.textSecondary}>
                  {item}
                </Txt>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>

      <View style={{ paddingTop: 16, paddingHorizontal: 24, paddingBottom: Math.max(28, insets.bottom) }}>
        <PrimaryButton label={`Join ${MOCK_GYM.name}`} />
      </View>
    </View>
  );
}
