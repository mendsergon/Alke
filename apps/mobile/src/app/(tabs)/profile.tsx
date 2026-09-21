import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, GhostButton, ProPill, SecondaryButton } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { MOCK_GYM, MOCK_PROFILE } from '../../mock/mock-data';

export default function Profile() {
  const { c } = useTheme();
  const router = useRouter();
  const p = MOCK_PROFILE;

  return (
    <Screen gap={12}>
      <ScreenHeader title="Profile" subtitle="Account, gyms, subscription" />

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              backgroundColor: c.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="serifRowTitle" family="sans" weight={600} color={c.accent} tracking={0}>
              {p.initials}
            </Txt>
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <Txt variant="serifProseSmall" family="sans" weight={600} tracking={-0.01} style={{ lineHeight: 24 }}>
              {p.name}
            </Txt>
            <Txt variant="captionTight" color={c.textSecondary} tnum style={{ marginTop: 1 }}>
              {p.detail}
            </Txt>
          </View>
          <Icon name="chevronRight" size={20} color={c.textSecondary} />
        </View>
      </Card>

      <Card padding={16}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <MicroCaps color={c.accent}>Active gym</MicroCaps>
          <GhostButton label="Switch" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: tokens.radius.button,
              backgroundColor: c.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="gym" size={20} color={c.accent} />
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <Txt variant="rowTitle" weight={600} tracking={0}>
              {MOCK_GYM.name}
            </Txt>
            <Txt variant="captionTight" color={c.textSecondary}>
              {MOCK_GYM.place} · {MOCK_GYM.machines} machines on file
            </Txt>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: c.border,
          }}
        >
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <Txt variant="rowLabel" weight={500}>
              {p.memberships.count}
            </Txt>
            <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
              {p.memberships.detail}
            </Txt>
          </View>
          <Icon name="chevronRight" size={18} color={c.textSecondary} />
        </View>
        <View style={{ marginTop: 2 }}>
          <SecondaryButton
            label="Join a gym with a code or QR"
            icon="qr"
            height={42}
            onPress={() => router.push('/join-gym')}
          />
        </View>
      </Card>

      <Card tone="accentSoft">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt variant="rowTitle" weight={600} tracking={0}>
                {p.subscription.name}
              </Txt>
              <ProPill />
            </View>
            <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
              {p.subscription.detail}
            </Txt>
          </View>
          <Icon name="chevronRight" size={20} color={c.textSecondary} />
        </View>
      </Card>

      <Card padding={16}>
        {p.settings.map((s, i) => (
          <Pressable
            key={s.name}
            accessibilityRole="button"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: i === 2 ? 11 : 10,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: c.border,
            }}
          >
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Txt variant="rowLabel" weight={500}>
                {s.name}
              </Txt>
              <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
                {s.detail}
              </Txt>
            </View>
            <Icon name="chevronRight" size={18} color={c.textSecondary} />
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
