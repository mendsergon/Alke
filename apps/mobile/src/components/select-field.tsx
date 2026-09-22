import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, View } from 'react-native';
import { Icon } from './icon';
import { Txt } from '../theme/text';
import { tokens, useTheme } from '../theme/theme';

/**
 * An input that opens its choices immediately under itself.
 *
 * The box is the design's input (`design/rungs-ui.pdf`, "Buttons and inputs"):
 * `surfaceRaised` fill, 12px radius, a 2px accent border while it is open, the
 * way that sheet draws a focused field. The list that comes down is the same
 * box continued — same fill, same radius — and it opens by growing, not by
 * appearing: height and opacity over 200ms, so nothing pops.
 */
export function SelectField({
  value,
  placeholder,
  options,
  open,
  onToggle,
  onSelect,
  accessibilityLabel,
  align = 'left',
  display,
  invalid = false,
}: {
  value: string;
  placeholder: string;
  options: readonly string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (next: string) => void;
  accessibilityLabel: string;
  /**
   * Centred is the design's code box (`design/rungs-ui.pdf`, "Join a gym"):
   * equal boxes on one line, the value in the middle of each.
   */
  align?: 'left' | 'center';
  /** What the box shows, when that is not the value itself. */
  display?: string;
  /** Marked because it is missing or wrong; the box says so without words. */
  invalid?: boolean;
}) {
  const { c } = useTheme();
  const scroller = useRef<ScrollView>(null);
  const reveal = useRef(new Animated.Value(0)).current;

  const rows = Math.min(options.length, VISIBLE_ROWS);
  const listHeight = rows * OPTION_HEIGHT + tokens.space[8] * 2;

  /**
   * The options exist only while the list is down. A year list is eighty-six
   * rows; three of these on one screen, all mounted from launch, is a hundred
   * and thirty live rows behind a closed box. They mount when it opens and
   * leave once it has finished closing.
   */
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const gone = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(gone);
  }, [open]);

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: open ? 1 : 0,
      duration: open ? OPEN_MS : CLOSE_MS,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      // A height cannot be driven natively. One small box, not a long list.
      useNativeDriver: false,
    }).start();
  }, [open, reveal]);

  // Eighty-seven years open on the one already chosen, not at 15.
  const selected = options.indexOf(value);
  useEffect(() => {
    if (!open || !mounted || selected < 1) return;
    const y = Math.max(0, (selected - 1) * OPTION_HEIGHT);
    const id = setTimeout(() => scroller.current?.scrollTo({ y, animated: false }), 0);
    return () => clearTimeout(id);
  }, [open, mounted, selected]);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: open }}
        accessibilityValue={{ text: value || placeholder }}
        onPress={onToggle}
        style={{
          height: FIELD_HEIGHT,
          paddingHorizontal: align === 'center' ? tokens.space[8] : 14,
          borderRadius: tokens.radius.button,
          backgroundColor: open ? c.surfaceRaised : c.surface,
          borderWidth: open ? 2 : 1,
          borderColor: open ? c.accent : invalid ? c.destructive : c.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          gap: align === 'center' ? tokens.space[4] : tokens.space[8],
        }}
      >
        <Txt
          variant="body"
          color={value ? c.text : c.textSecondary}
          numberOfLines={1}
          style={align === 'center' ? { flexShrink: 1 } : { flexGrow: 1, flexShrink: 1 }}
        >
          {(value ? display ?? value : '') || placeholder}
        </Txt>
        <Animated.View
          style={{
            transform: [
              {
                rotate: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          }}
        >
          <Icon
            name="chevronDown"
            size={align === 'center' ? 14 : 18}
            color={open ? c.accent : c.textSecondary}
            width={1.7}
          />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={{
          overflow: 'hidden',
          opacity: reveal,
          height: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, listHeight + 6] }),
        }}
      >
        <View
          style={{
            marginTop: 6,
            height: listHeight,
            borderRadius: tokens.radius.button,
            backgroundColor: c.surfaceRaised,
            borderWidth: 1,
            borderColor: c.border,
            paddingVertical: tokens.space[8],
          }}
        >
          <ScrollView ref={scroller} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {(mounted ? options : []).map((option) => {
              const on = option === value;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    onSelect(option);
                    onToggle();
                  }}
                  style={{
                    height: OPTION_HEIGHT,
                    marginHorizontal: tokens.space[8],
                    paddingHorizontal: tokens.space[8],
                    borderRadius: tokens.radius.chip,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: align === 'center' ? 'center' : 'flex-start',
                    gap: tokens.space[8],
                    backgroundColor: on ? c.accentSoft : 'transparent',
                  }}
                >
                  <Txt
                    variant="rowLabel"
                    weight={on ? 600 : 400}
                    color={on ? c.accent : c.text}
                    numberOfLines={1}
                    style={align === 'center' ? { flexShrink: 1 } : { flexGrow: 1, flexShrink: 1 }}
                  >
                    {option}
                  </Txt>
                  {on ? <Icon name="check" size={16} color={c.accent} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}

/** The design's field height, one option, and how many are down before it scrolls. */
const OPEN_MS = 200;
const CLOSE_MS = 150;
const FIELD_HEIGHT = 52;
const OPTION_HEIGHT = 40;
const VISIBLE_ROWS = 4;
