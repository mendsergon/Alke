import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { tokens, useTheme } from '../theme/theme';
import type { ProgramRecord } from '../backend/programs';

/**
 * A program as its own object: the raised card design page 04 draws on
 * Explore, used for templates there and for the person's programs in Library.
 * The whole card presses, and shows it.
 */
export function ProgramCard({
  label,
  onPress,
  padding = tokens.space[20],
  grow = false,
  children,
}: {
  label: string;
  onPress?: () => void;
  padding?: number;
  /** Takes an equal share of its row, and the row's full height. */
  grow?: boolean;
  children: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        // Pressed, the card sinks to the page tone; its neutral pill is
        // surface-raised and would vanish against a raised card.
        backgroundColor: pressed ? c.bg : c.surface,
        borderRadius: tokens.radius.card,
        borderWidth: 1,
        borderColor: c.border,
        padding,
        flex: grow ? 1 : undefined,
      })}
    >
      {children}
    </Pressable>
  );
}

/**
 * Seven squares, Monday to Sunday in order. A training day is the accent, a
 * rest day the muted body tone; both are solid. The design fills the first N
 * as a count; this marks the actual days, on Stavros's instruction.
 */
export function DayDots({ schedule }: { schedule: ProgramRecord['schedule'] }) {
  const { c } = useTheme();
  const dot = tokens.templateCard.dayDot;
  return (
    <View style={{ flexDirection: 'row', gap: dot.gap, alignItems: 'center' }}>
      {schedule.map((day, i) => (
        <View
          key={i}
          style={{
            width: dot.size,
            height: dot.size,
            borderRadius: dot.radius,
            backgroundColor: day === 'training' ? c.accent : c.iconBody,
          }}
        />
      ))}
    </View>
  );
}

const WEEKDAY_SHORT: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

/** "Mon · Wed · Fri": the days the program trains. */
export function weekLine(program: ProgramRecord): string {
  return program.days.map((d) => WEEKDAY_SHORT[d.weekday] ?? d.weekday).join(' · ');
}
