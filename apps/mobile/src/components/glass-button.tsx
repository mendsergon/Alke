import { Pressable } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Icon, type IconName } from './icon';
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
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
}) {
  const { c, scheme } = useTheme();
  const size = tokens.sizing.tapTarget.ios;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <GlassView
        glassEffectStyle="regular"
        isInteractive
        colorScheme={scheme}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={22} color={c.text} width={1.75} />
      </GlassView>
    </Pressable>
  );
}
