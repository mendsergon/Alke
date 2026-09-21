import { Pressable, View } from 'react-native';
import { tokens, useTheme } from '../theme/theme';
import { MicroCaps, Txt } from '../theme/text';
import { Icon } from './icon';
import { Rung } from './rung';
import type { WeekStat } from '../mock/mock-data';

/** Gym chip + calendar, the header every Home state starts with. */
export function HomeTopBar({ gym }: { gym: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        style={{
          height: 32,
          paddingLeft: 8,
          paddingRight: 10,
          borderRadius: tokens.radius.rung,
          backgroundColor: c.surface,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <Icon name="gym" size={15} color={c.accent} />
        <Txt variant="captionTight" weight={500}>
          {gym}
        </Txt>
        <Icon name="chevronDown" size={14} color={c.textSecondary} width={1.7} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Calendar"
        style={{ width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' }}
      >
        <Icon name="calendar" size={22} color={c.textSecondary} width={1.5} />
      </Pressable>
    </View>
  );
}

/** Gym chip, screen title and date — one block, as the export draws it. */
export function HomeHeader({
  gym,
  title,
  subtitle,
}: {
  gym: string;
  title: string;
  subtitle: string;
}) {
  const { c } = useTheme();
  return (
    <View>
      <HomeTopBar gym={gym} />
      <Txt variant="screenTitle" family="serif" weight={500} style={{ marginTop: 14 }}>
        {title}
      </Txt>
      <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
        {subtitle}
      </Txt>
    </View>
  );
}

/** Sessions / sets / muscles-in-range, each over its own rung. */
export function WeekStats({ stats }: { stats: WeekStat[] }) {
  const { c } = useTheme();
  return (
    <View>
      <MicroCaps>This week</MicroCaps>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
        {stats.map((s) => (
          <View key={s.label} style={{ flexGrow: 1, flexBasis: 0 }}>
            <View style={{ marginBottom: 8, height: 28 }}>
              <MicroCaps>{s.label}</MicroCaps>
            </View>
            <View style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'baseline' }}>
              <Txt variant="numeralM" weight={600} tnum>
                {s.value}
              </Txt>
              <Txt variant="unitSmall" color={c.textSecondary} style={{ marginLeft: 3 }}>
                {s.suffix}
              </Txt>
            </View>
            <Rung value={s.done} target={s.target} />
          </View>
        ))}
      </View>
    </View>
  );
}
