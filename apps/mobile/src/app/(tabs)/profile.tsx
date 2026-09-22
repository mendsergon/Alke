import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { Card, Pill, SecondaryButton } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { Segmented } from '../../components/surfaces';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useGym } from '../../gym/gym';
import { useAuth } from '../../auth/auth';

import {
  THEME_OPTIONS,
  UNIT_OPTIONS,
  type ThemePreference,
  type Units,
} from '../../account/account-fields';

/** A settings row whose control sits under its label, full width. */
function SettingRow({
  label,
  children,
  first,
}: {
  label: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        paddingVertical: 12,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.border,
      }}
    >
      <Txt variant="rowLabel" weight={500} style={{ marginBottom: 10 }}>
        {label}
      </Txt>
      {children}
    </View>
  );
}

export default function Profile() {
  const { c, preference, setPreference } = useTheme();
  const { gym } = useGym();
  const router = useRouter();
  const { account, saveAccount, signOut } = useAuth();

  // What is shown is what is stored. Tapping writes the column and the row
  // that comes back is what the controls read, so nothing here is a setting
  // that only this phone knows about.
  const units = (account?.units as Units | undefined) ?? 'kg';

  // Everything the card shows is a column, read straight off the row.
  const fullName = [account?.name, account?.surname].filter(Boolean).join(' ');
  const initials = [account?.name, account?.surname]
    .filter(Boolean)
    .map((part) => part!.charAt(0).toUpperCase())
    .join('');
  const storedTheme = account?.theme as ThemePreference | undefined;

  // The app opens in the theme the account chose.
  useEffect(() => {
    if (storedTheme && storedTheme !== preference) setPreference(storedTheme);
    // Only when the stored value changes: this follows the account, not the
    // control.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedTheme]);

  return (
    <Screen gap={12}>
      <ScreenHeader title="Profile" subtitle="Account, gyms, subscription" />

      <Card>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account"
          onPress={() => router.push('/account')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              backgroundColor: initials ? c.accentSoft : c.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {initials ? (
              <Txt variant="avatarInitials" color={c.accent}>
                {initials}
              </Txt>
            ) : (
              <Icon name="person" size={22} color={c.textSecondary} />
            )}
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <Txt variant="nameTitle">{fullName || 'Account'}</Txt>
            {account ? (
              <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 1 }}>
                {account.username} · {account.email}
              </Txt>
            ) : null}
          </View>
          <Icon name="chevronRight" size={20} color={c.textSecondary} />
        </Pressable>
      </Card>

      <Card padding={16}>
        <MicroCaps color={gym ? c.accent : c.textSecondary}>Active gym</MicroCaps>
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
            <Icon name="gym" size={20} color={gym ? c.accent : c.textSecondary} />
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <Txt variant="rowTitle" weight={600} tracking={0} color={gym ? c.text : c.textSecondary}>
              {gym ? gym.name : 'No gym'}
            </Txt>
            <Txt variant="captionTight" color={c.textSecondary}>
              {gym ? `${gym.place} · ${gym.machines} machines on file` : 'Not joined'}
            </Txt>
          </View>
        </View>
        <View style={{ marginTop: 14 }}>
          <SecondaryButton
            label="Join with a code or QR"
            icon="qr"
            height={42}
            onPress={() => router.push('/join-gym')}
          />
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt variant="rowTitle" weight={600} tracking={0}>
                {account?.subscription_status === 'premium' ? 'Premium' : 'Free'}
              </Txt>
              <Pill label="Current" tone="neutral" />
            </View>

          </View>
        </View>
      </Card>

      <Card padding={16}>
        <SettingRow label="Units" first>
          <Segmented
            options={UNIT_OPTIONS}
            value={units}
            onChange={(next) => void saveAccount({ units: next })}
          />
        </SettingRow>
        <SettingRow label="Theme">
          <Segmented
            options={THEME_OPTIONS}
            value={storedTheme ?? preference}
            onChange={(next) => {
              // Answer the tap now, keep it on the server after.
              setPreference(next);
              void saveAccount({ theme: next });
            }}
          />
        </SettingRow>
      </Card>

      <Card padding={16}>
        <Pressable accessibilityRole="button" onPress={signOut} style={{ paddingVertical: 6 }}>
          <Txt variant="rowLabel" weight={500} color={c.destructive}>
            Sign out
          </Txt>
        </Pressable>
      </Card>
    </Screen>
  );
}
