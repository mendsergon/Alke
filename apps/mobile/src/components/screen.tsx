import { ScrollView, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens, useTheme } from '../theme/theme';
import { Txt } from '../theme/text';

/**
 * A tab screen's body. The design frames are drawn without a status bar, so
 * the top inset is added on top of the frame's own 24px padding.
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
      {children}
    </ScrollView>
  );
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
      <View style={{ flexShrink: 1 }}>
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
