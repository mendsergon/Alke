import { Image, Pressable } from 'react-native';
import { tokens, useTheme } from '../theme/theme';
import starIcon from '../../assets/images/star.png';
import starFilledIcon from '../../assets/images/star-filled.png';

/**
 * An exercise's star: grey and open, or gold and filled when it is one of the
 * person's favorites (Stavros, 3 October 2026). As tall as a card's last line,
 * so the card keeps its height; its touch area is a full tap target. `push`
 * sets it at the end of its row.
 */
export function Star({ on, onPress, push = false }: { on: boolean; onPress: () => void; push?: boolean }) {
  const { c } = useTheme();
  const size = tokens.type.captionTight.lineHeight;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? 'Remove from favorites' : 'Add to favorites'}
      accessibilityState={{ selected: on }}
      hitSlop={(tokens.sizing.tapTarget.ios - size) / 2}
      onPress={onPress}
      style={push ? { marginLeft: 'auto' } : undefined}
    >
      <Image
        source={on ? starFilledIcon : starIcon}
        style={{ width: size, height: size, tintColor: on ? c.recordFill : c.textSecondary }}
      />
    </Pressable>
  );
}
