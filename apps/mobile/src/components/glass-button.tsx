import { Pressable } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Icon, type IconName } from './icon';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';

/**
 * A header action as iOS 26 draws its own: a Liquid Glass circle with the
 * glyph in the label tone. The same bubble Account uses for Back.
 *
 * `expo-glass-effect@57.0.3` wraps UIVisualEffectView's UIGlassEffect;
 * `isInteractive` is what makes the lens answer a finger the way the system's
 * buttons do, and `colorScheme` is the app's own scheme, not the phone's.
 */
export function GlassButton({
  icon,
  label,
  title,
  accent = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  /** Written beside the glyph: the bubble becomes a capsule. */
  title?: string;
  /** The glyph and title in the accent, for the screen's main action. */
  accent?: boolean;
  onPress?: () => void;
}) {
  const { c, scheme } = useTheme();
  const size = tokens.sizing.tapTarget.ios;
  const tone = accent ? c.accent : c.text;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <GlassView
        glassEffectStyle="regular"
        isInteractive
        colorScheme={scheme}
        style={{
          width: title ? undefined : size,
          height: size,
          borderRadius: size / 2,
          paddingLeft: title ? tokens.space[12] : 0,
          paddingRight: title ? tokens.space[16] : 0,
          flexDirection: 'row',
          gap: tokens.space[8],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={title ? 20 : 22} color={tone} width={1.75} />
        {title ? (
          <Txt variant="label" weight={600} color={tone}>
            {title}
          </Txt>
        ) : null}
      </GlassView>
    </Pressable>
  );
}
