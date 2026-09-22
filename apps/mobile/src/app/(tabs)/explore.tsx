import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ScreenHeader } from '../../components/screen';
import { EmptyState } from '../../components/surfaces';
import { Icon } from '../../components/icon';
import { MicroCaps, Txt } from '../../theme/text';
import { tokens, useTheme } from '../../theme/theme';
import { useGym } from '../../gym/gym';
import { FEATURED_TEMPLATES, GYM_PROGRAMS, SHARED_PROGRAMS } from '../../mock/mock-data';

function SearchBar() {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 46,
        paddingHorizontal: 14,
        borderRadius: tokens.radius.button,
        backgroundColor: c.surface,
      }}
    >
      <Icon name="search" size={18} color={c.textSecondary} />
      <Txt color={c.textSecondary}>Search programs</Txt>
    </View>
  );
}

/** Everything on this screen is served. Until there is a backend, it is empty. */
export default function Explore() {
  const { c } = useTheme();
  const router = useRouter();
  const { gym } = useGym();

  return (
    <Screen gap={14}>
      <ScreenHeader title="Explore" subtitle="Programs from other lifters" />
      <SearchBar />

      <MicroCaps>Featured</MicroCaps>
      {FEATURED_TEMPLATES.length > 0 ? null : <EmptyState line="No featured programs yet." />}

      <View style={{ height: 4 }} />
      <MicroCaps>Shared by other lifters</MicroCaps>
      {SHARED_PROGRAMS.length > 0 ? null : <EmptyState line="No shared programs yet." />}

      <View style={{ height: 4 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="gym" size={16} color={gym ? c.accent : c.textSecondary} />
        <MicroCaps color={gym ? c.accent : c.textSecondary}>
          {gym ? `From ${gym.name}` : 'From your gym'}
        </MicroCaps>
      </View>
      {GYM_PROGRAMS.length > 0 ? null : (
        <EmptyState
          line={gym ? 'No programs from your gym yet.' : 'No gym joined.'}
          action={gym ? undefined : 'Join with a code'}
          icon="qr"
          onAction={() => router.push('/join-gym')}
        />
      )}
    </Screen>
  );
}
