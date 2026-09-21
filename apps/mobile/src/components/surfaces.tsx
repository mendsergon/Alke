import { Pressable, View, type ViewProps, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { tokens, useTheme } from '../theme/theme';
import { Txt } from '../theme/text';
import { Icon, type IconName } from './icon';

/** The standard card: surface, radius 16, 20px padding, 1px border in light. */
export function Card({
  tone = 'surface',
  padding = tokens.space[20],
  style,
  children,
  ...rest
}: ViewProps & {
  tone?: 'surface' | 'accentSoft';
  padding?: number;
  children?: ReactNode;
}) {
  const { c, cardBorderWidth } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: tone === 'accentSoft' ? c.accentSoft : c.surface,
          borderRadius: tokens.radius.card,
          padding,
          borderWidth: cardBorderWidth,
          borderColor: c.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A metadata chip: bg tone, radius 8, 12/17 secondary text. */
export function Chip({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        paddingVertical: 4,
        paddingHorizontal: 9,
        borderRadius: tokens.radius.chip,
        backgroundColor: c.bg,
      }}
    >
      <Txt variant="micro" color={c.textSecondary} tnum>
        {children}
      </Txt>
    </View>
  );
}

/** A status pill: fully rounded, micro-caps label. */
export function Pill({
  label,
  tone = 'accent',
}: {
  label: string;
  tone?: 'accent' | 'neutral' | 'record';
}) {
  const { c } = useTheme();
  const bg = tone === 'accent' ? c.accentSoft : tone === 'record' ? c.recordSoft : c.surfaceRaised;
  const fg = tone === 'accent' ? c.accent : tone === 'record' ? c.recordText : c.textSecondary;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: tokens.radius.rung,
        backgroundColor: bg,
      }}
    >
      {tone === 'record' ? (
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: c.recordFill }} />
      ) : null}
      <Txt variant="microCaps" weight={600} caps color={fg}>
        {label}
      </Txt>
    </View>
  );
}

/** The gated-feature marker. */
export function ProPill() {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 3,
        paddingLeft: 6,
        paddingRight: 8,
        borderRadius: tokens.radius.rung,
        backgroundColor: c.accentSoft,
      }}
    >
      <Icon name="diamond" size={12} color={c.accent} />
      <Txt variant="microCaps" weight={600} caps color={c.accent} tracking={0.1}>
        Pro
      </Txt>
    </View>
  );
}

/** Accent-filled primary action. */
export function PrimaryButton({
  label,
  icon,
  height = tokens.sizing.primaryButtonHeight.min,
  onPress,
}: {
  label: string;
  icon?: IconName;
  height?: number;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        width: '100%',
        height,
        borderRadius: tokens.radius.button,
        backgroundColor: c.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      {icon ? <Icon name={icon} size={20} color={c.onAccent} width={1.8} /> : null}
      <Txt variant="buttonLabel" weight={600} color={c.onAccent}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Outlined secondary action. */
export function SecondaryButton({
  label,
  icon,
  height = 48,
  dashed = false,
  onPress,
  style,
}: {
  label: string;
  icon?: IconName;
  height?: number;
  dashed?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        {
          width: '100%',
          height,
          borderRadius: tokens.radius.button,
          borderWidth: 1,
          borderStyle: dashed ? 'dashed' : 'solid',
          borderColor: c.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={dashed ? 18 : 20} color={dashed ? c.textSecondary : c.text} /> : null}
      <Txt variant="rowLabel" weight={500} color={dashed ? c.textSecondary : c.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Rounded outline button used inline in card headers. */
export function GhostButton({ label, onPress }: { label: string; onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        height: 32,
        paddingHorizontal: 12,
        borderRadius: tokens.radius.rung,
        borderWidth: 1,
        borderColor: c.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt variant="captionTight" weight={600}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** The segmented control above Library and Progress. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        padding: 4,
        borderRadius: 10,
        backgroundColor: c.surface,
      }}
    >
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            accessibilityRole="button"
            onPress={() => onChange(o)}
            style={{
              flexGrow: 1,
              flexBasis: 0,
              height: 36,
              borderRadius: tokens.radius.chip,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? c.bg : 'transparent',
            }}
          >
            <Txt
              variant="captionTight"
              weight={on ? 600 : 500}
              color={on ? c.text : c.textSecondary}
              numberOfLines={1}
            >
              {o}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A divider-separated list inside a card. */
export function RowList({ children }: { children: ReactNode }) {
  return <View>{children}</View>;
}

export function Row({
  first = false,
  paddingVertical = 12,
  children,
}: {
  first?: boolean;
  paddingVertical?: number;
  children: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.border,
      }}
    >
      {children}
    </View>
  );
}
