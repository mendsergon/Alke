import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { Register } from '../auth/register';
import { useTheme } from '../theme/theme';

/**
 * The register page is a Stack screen because the scroll edge effect is a
 * property of a native Screen and only the Stack gives it one — the gate is a
 * layer over the navigator, not a navigator. It is presented with a fade and
 * no gesture, so there is nothing pushed and nothing to swipe back out of.
 *
 * It carries the gate's own material, so the app is still there behind it.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { c, scheme } = useTheme();
  const [liquid] = useState(isGlassEffectAPIAvailable);

  return (
    <View style={{ flex: 1 }}>
      {liquid ? (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={scheme}
          tintColor={`${c.bg}40`}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <BlurView
          intensity={GLASS_BLUR}
          tint={scheme === 'dark' ? 'systemMaterialDark' : 'systemMaterialLight'}
          style={[StyleSheet.absoluteFill, { backgroundColor: `${c.bg}A6` }]}
        />
      )}
      <Register onDone={() => router.back()} />
    </View>
  );
}

/** The gate's own blur, so the two surfaces are the same material. */
const GLASS_BLUR = 56;
