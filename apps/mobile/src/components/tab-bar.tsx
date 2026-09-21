import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { Txt } from '../theme/text';
import { Icon, type IconName } from './icon';
import { MiniBar } from './mini-bar';

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'explore', label: 'Explore', icon: 'compass' },
  { name: 'library', label: 'Library', icon: 'library' },
  { name: 'progress', label: 'Progress', icon: 'chart' },
  { name: 'profile', label: 'Profile', icon: 'person' },
];

/** Only the parts of the navigator's tab-bar props this bar actually reads. */
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

export function TabBar({ state, navigation }: TabBarProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;

  return (
    <View>
      <MiniBar />
      <View
        style={{
          height: 76 + Math.max(0, insets.bottom - 16),
          paddingTop: 4,
          paddingHorizontal: 8,
          paddingBottom: Math.max(16, insets.bottom),
          backgroundColor: c.bg,
          borderTopWidth: 1,
          borderTopColor: c.border,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        {TABS.map((t) => {
          const on = current === t.name;
          return (
            <Pressable
              key={t.name}
              accessibilityRole="button"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: on }}
              onPress={() => navigation.navigate(t.name)}
              style={{
                flexGrow: 1,
                flexBasis: 0,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Icon
                name={t.icon}
                size={22}
                color={on ? c.accent : c.textSecondary}
                width={on ? 1.6 : 1.4}
              />
              <Txt variant="tabLabel" weight={on ? 600 : 500} color={on ? c.accent : c.textSecondary}>
                {t.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
