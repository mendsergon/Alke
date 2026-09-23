import { Pressable, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { tokens, useTheme } from '../theme/theme';

/**
 * The two-sided switch over a `SwitchScreen`, drawn as `Segmented` draws its
 * fitted form. Its highlight is not set per option: it slides and resizes
 * with the pager's own scroll position, so it moves with the page on a tap
 * and follows a swipe as it happens. The labels cross-fade their colour at one
 * weight, so nothing changes width while it moves.
 */
export function PagerSwitch<T extends string>({
  options,
  value,
  onChange,
  progress,
}: {
  options: readonly [T, T];
  value: T;
  onChange: (v: T) => void;
  /** 0 on the first side, 1 on the second, fractional while sliding. */
  progress: SharedValue<number>;
}) {
  const { c } = useTheme();
  // One value per segment: two layouts land together, and a shared array
  // rewritten by both loses whichever lands first.
  const x0 = useSharedValue(0);
  const w0 = useSharedValue(0);
  const x1 = useSharedValue(0);
  const w1 = useSharedValue(0);

  const highlight = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, progress.value));
    return {
      opacity: w0.value > 0 && w1.value > 0 ? 1 : 0,
      left: x0.value + (x1.value - x0.value) * p,
      width: w0.value + (w1.value - w0.value) * p,
    };
  });

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
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 4,
            height: 36,
            borderRadius: tokens.radius.chip,
            backgroundColor: c.bg,
          },
          highlight,
        ]}
      />
      {options.map((o, i) => (
        <Segment
          key={o}
          label={o}
          index={i}
          selected={o === value}
          progress={progress}
          onPress={() => onChange(o)}
          onMeasure={(x, w) => {
            (i === 0 ? x0 : x1).value = x;
            (i === 0 ? w0 : w1).value = w;
          }}
        />
      ))}
    </View>
  );
}

function Segment({
  label,
  index,
  selected,
  progress,
  onPress,
  onMeasure,
}: {
  label: string;
  index: number;
  selected: boolean;
  progress: SharedValue<number>;
  onPress: () => void;
  onMeasure: (x: number, width: number) => void;
}) {
  const { c } = useTheme();
  const on = c.text;
  const off = c.textSecondary;
  const colour = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, progress.value));
    return { color: interpolateColor(p, [0, 1], index === 0 ? [on, off] : [off, on]) };
  });
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      onLayout={(e) => onMeasure(e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
      style={{
        height: 36,
        paddingHorizontal: tokens.space[12],
        borderRadius: tokens.radius.chip,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.Text
        numberOfLines={1}
        style={[
          {
            fontFamily: tokens.fontFamily.sansSemiBold,
            fontSize: tokens.type.captionTight.size,
            lineHeight: tokens.type.captionTight.lineHeight,
          },
          colour,
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}
