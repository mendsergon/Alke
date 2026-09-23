import type { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * One side of a Programs / Exercises switch. Both sides stay mounted, so a
 * switch only shows one and hides the other rather than building it again.
 *
 * The hidden side is taken out of the layout, made transparent and shut to
 * touches and to VoiceOver — not `display: none`, which blanks a Skia canvas
 * (the Build button's orb) that then never draws again.
 */
export function SwitchSide({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <View
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      style={active ? undefined : { position: 'absolute', left: 0, right: 0, top: 0, opacity: 0 }}
    >
      {children}
    </View>
  );
}
