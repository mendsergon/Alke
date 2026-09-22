import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens, useTheme } from '../theme/theme';
import { Txt } from '../theme/text';
import { Arriving } from './arrival';

/**
 * A tab screen's body. The design frames are drawn without a status bar, so
 * the top inset is added on top of the frame's own 24px padding.
 *
 * Each block on the screen is its own arriving element: it sits back and dim
 * behind the gate and comes forward into place as the glass releases, one
 * after the next. A screen reached with the gate already gone is at rest and nothing
 * moves — an arrival happens once, not on every visit.
 */
export function Screen({
  gap = tokens.space[16],
  children,
  style,
}: {
  gap?: number;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const blocks = flatten(children);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[
        {
          paddingTop: insets.top + tokens.space[24],
          paddingHorizontal: tokens.space[24],
          paddingBottom: tokens.space[20],
          gap,
        },
        style,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {blocks.map((block, i) => (
        // Keyed by position in the flattened list, not by the child's own
        // key: `Children.toArray` numbers keys per call, so opening two
        // fragments produces two children both called `.0`.
        <Arriving key={i} index={i}>
          {block}
        </Arriving>
      ))}
    </ScrollView>
  );
}

/**
 * A screen's blocks, with fragments opened out.
 *
 * `Children.toArray` counts a fragment as one child, so a branch that returns
 * `<>…</>` — which every conditional section here does — arrived as a single
 * block: no gap between the things inside it, and the whole branch arriving as
 * one lump. Opening fragments makes the gap and the stagger apply to what is
 * actually on the screen.
 */
function flatten(children: ReactNode): ReactElement[] {
  const out: ReactElement[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (child.type === Fragment) {
      out.push(...flatten((child.props as { children?: ReactNode }).children));
    } else {
      out.push(child);
    }
  }
  return out;
}

/** Screen title and its one-line subtitle, with an optional trailing action. */
export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ flexShrink: 1, flexGrow: 1 }}>
        <Txt variant="screenTitle" family="serif" weight={500}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="captionTight" color={c.textSecondary} style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {action}
    </View>
  );
}
