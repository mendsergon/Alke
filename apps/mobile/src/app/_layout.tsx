import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
// Deep imports, one file each: importing the package index would pull every
// weight and italic of both families into the bundle.
import Newsreader_500Medium from '@expo-google-fonts/newsreader/500Medium/Newsreader_500Medium.ttf';
import Geist_400Regular from '@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf';
import Geist_500Medium from '@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf';
import Geist_600SemiBold from '@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf';
import { ThemeProvider, useTheme } from '../theme/theme';
import { SessionProvider } from '../session/session';
import { GymProvider } from '../gym/gym';
import { AuthProvider, useAuth } from '../auth/auth';
import { SignIn } from '../auth/sign-in';
import { ArrivalProvider } from '../components/arrival';
import { LibraryProvider } from '../library/library';

SplashScreen.preventAutoHideAsync();

/**
 * Signing in is two things at once: a sheet of glass de-materializes, and the
 * app materializes through it.
 *
 * The second half is the one that matters, and it is the one that is easy to
 * miss. A gate that merely uncovers a finished screen has not transitioned into
 * anything — the app reads as having launched while you were not looking,
 * whatever the gate did on its way out. So Home is not waiting there complete.
 * It is suspended: held back and dim behind the glass, which through the blur
 * is the soft field of light a material needs in order to be a material at all.
 * As the glass releases, Home comes forward into itself, block after block. It
 * arrives by depth, not by displacement — a block sliding a few pixels up has
 * moved, but it has not resolved into anything.
 *
 * The glass follows apple-design §12 literally:
 *
 *   "Materialize, don't just fade. For glass/blur surfaces, animate blur radius
 *    and scale together on enter/exit, so the surface reads as a real material
 *    arriving rather than a plain opacity fade."
 *
 *   "Dim to focus, separate to keep flow. A modal task pairs the surface with a
 *    dimming scrim and pushes the background back."
 *
 * So the pane does not travel anywhere. It loses its size and its blur
 * together, in place, and the app comes forward out of its recess through it.
 *
 * The material is `GlassView` (iOS 26 `UIGlassEffect`) wherever the runtime has
 * it: Liquid Glass proper, which bends what is behind it instead of only
 * blurring it. That refraction is the difference between glass and frost, and
 * it is why the suspended screen underneath has to be lit. `BlurView` is the
 * fallback, and there the blur radius carries what the refraction would have.
 *
 * The two halves overlap rather than queue — the app is already on its way up
 * while the glass is still going, so the in-between frames point at the outcome
 * (§8). Enter and exit are the same path reversed (§7).
 *
 * Everything animated is transform, opacity or blur radius — no layout pass —
 * and it runs on the UI thread through Reanimated worklets, so a busy JS thread
 * cannot stutter it.
 */

/** A spring, not a curve: interruptible and re-targetable mid-flight (§4). */
const RELEASE = {
  duration: 420,
  dampingRatio: 0.9,
  // Reduced motion is decided below; the spring must not skip to its end value
  // behind that decision.
  reduceMotion: ReduceMotion.Never,
} as const;

/**
 * The arrival is not a spring. It is a staggered procession with no finger on
 * it, so it takes a strong ease-out and runs longer than the glass: the last
 * block is still settling after the pane has gone.
 */
const ARRIVE = {
  duration: 820,
  easing: Easing.bezier(0.23, 1, 0.32, 1),
  reduceMotion: ReduceMotion.Never,
} as const;

/** Reduced motion keeps the state legible and drops travel and scale (§14). */
const REDUCED = { duration: 200, reduceMotion: ReduceMotion.Never } as const;

/**
 * OPEN: PLAN.md §3 defines no motion or material tokens, so the timings above
 * and the three values below are choices in code, not plan values.
 */
const GLASS_BLUR = 56;
/** The size the glass forms from and returns to. Never 0 — nothing appears from nothing. */
const GLASS_GONE = 0.94;
/**
 * How far the pane hangs off every side of the screen.
 *
 * The pane is a rectangle, and a rectangle scaled down inside the frame walks
 * its own edges into view — you watch the blur's corners travel, which is the
 * one thing that gives away that it is a layer rather than a material. Hung
 * past the screen on all four sides, it can shrink through its whole range
 * without an edge ever crossing the frame.
 */
const GLASS_BLEED = 80;
/** How far back the app sits under the glass, before it comes forward. */
const APP_RECESSED = 0.96;
/**
 * How far the scrim dims the app. It dims; it does not cover. An opaque scrim
 * leaves the glass with nothing behind it, and glass with nothing behind it is
 * a coloured rectangle — which is exactly how a transition collapses back into
 * a fade.
 */
const SCRIM = 0.4;
/** The beat of bare glass: the sign-in has gone, Home has not started. */
const ARRIVAL_HOLD = 130;

function Gate() {
  const { c, scheme } = useTheme();
  const { entered } = useAuth();
  const reduced = useReducedMotion();

  // 1 = the glass is formed over the app. 0 = it is gone.
  const glass = useSharedValue(entered ? 0 : 1);
  // 0 = the app is suspended behind the glass. 1 = it has arrived.
  const arrival = useSharedValue(entered ? 1 : 0);
  const [gateMounted, setGateMounted] = useState(!entered);
  const [solid, setSolid] = useState(false);
  // Liquid Glass is missing on some iOS 26 betas and on every other platform,
  // and touching it there crashes. Frost is the fallback.
  const [liquid] = useState(isGlassEffectAPIAvailable);

  // Reduced transparency: a translucent pane becomes an opaque one (§14).
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((on) => {
      if (alive) setSolid(on);
    });
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setSolid);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!entered) {
      setGateMounted(true);
      glass.set(reduced ? withTiming(1, REDUCED) : withSpring(1, RELEASE));
      arrival.set(withTiming(0, reduced ? REDUCED : ARRIVE));
      return;
    }
    const done = (finished?: boolean) => {
      'worklet';
      // Once the glass is gone it leaves the tree, so nothing is blurring an
      // app nobody is looking through.
      if (finished) scheduleOnRN(setGateMounted, false);
    };
    glass.set(reduced ? withTiming(0, REDUCED, done) : withSpring(0, RELEASE, done));
    arrival.set(reduced ? withTiming(1, REDUCED) : withDelay(ARRIVAL_HOLD, withTiming(1, ARRIVE)));
  }, [entered, glass, arrival, reduced]);

  // The app comes out of its recess as the glass loses its hold on it.
  const appStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: reduced
          ? 1
          : interpolate(glass.get(), [0, 1], [1, APP_RECESSED], Extrapolation.CLAMP),
      },
    ],
  }));

  // The dimming that focus costs, lifting with the surface that imposed it.
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glass.get(), [0, 1], [0, SCRIM], Extrapolation.CLAMP),
  }));

  // Size and radius together — the pane's own de-materializing (§12).
  const paneStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glass.get(), [0, 0.5, 1], [0, 0.94, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: reduced
          ? 1
          : interpolate(glass.get(), [0, 1], [GLASS_GONE, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  // The sign-in is gone inside the first fifth of the release, well before Home
  // starts to rise. Overlap the two and they read as one cross-fade — two
  // legible layers in the same place at the same time is the whole definition
  // of one. So this is a hand-off, not a blend: writing off the glass, a beat
  // of bare material, then the app coming up through it.
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glass.get(), [0.82, 1], [0, 1], Extrapolation.CLAMP),
    // It goes back into the glass rather than dissolving where it stands.
    transform: [
      { scale: reduced ? 1 : interpolate(glass.get(), [0.82, 1], [0.97, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Animated.View style={[{ flex: 1 }, appStyle]}>
        <ArrivalProvider progress={arrival}>
          <Navigator />
        </ArrivalProvider>
      </Animated.View>
      {gateMounted ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }, scrimStyle]}
          />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { margin: -GLASS_BLEED },
              paneStyle,
            ]}
            pointerEvents={entered ? 'none' : 'auto'}
          >
            {liquid && !solid ? (
              <GlassView
                glassEffectStyle="regular"
                colorScheme={scheme}
                // Tinted with the app's own background, so the glass belongs to
                // Alke and not to the system.
                tintColor={`${c.bg}40`}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <BlurView
                // Static. Animating a full-screen blur's radius re-renders the
                // blur on every frame, which is what made the transition drag;
                // the pane's own opacity and scale carry the motion instead.
                intensity={solid ? 0 : GLASS_BLUR}
                tint={scheme === 'dark' ? 'systemMaterialDark' : 'systemMaterialLight'}
                style={[StyleSheet.absoluteFill, { backgroundColor: solid ? c.bg : `${c.bg}A6` }]}
              />
            )}
            <Animated.View
              style={[StyleSheet.absoluteFill, { margin: GLASS_BLEED }, contentStyle]}
            >
              <SignIn onGlass />
            </Animated.View>
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

function Navigator() {
  const { c } = useTheme();
  return (
    <>
      <Stack
        screenOptions={{
          // A native navigation bar has to exist for the system to draw its
          // scroll edge effect under it — that is what the effect attaches to.
          // It is transparent and carries no title, so the screen still draws
          // its own heading in the content and nothing is duplicated; all the
          // bar contributes is the chrome the effect needs.
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerBackVisible: false,
          // The effect covers the navigation bar's region, so a bar with only
          // the compact height gives a shallow band. The large-title layout
          // reserves a much taller one — with no title set, all it adds is
          // depth for the effect to work over.
          headerLargeTitleEnabled: true,
          contentStyle: { backgroundColor: c.bg },
          // The system's own scroll edge effect (`UIScrollEdgeEffect`), which
          // varies the blur radius continuously across the edge. Rebuilt in
          // JS it cannot be: a stack of blur panes bands at every boundary,
          // and a gradient-masked blur only varies the *alpha* of a uniformly
          // blurred copy, so sharp content ghosts through it.
          //
          // expo-router already passes this to `ScreenStackItem` for every
          // screen (native-stack/views/NativeStackView.native.js), defaulting
          // each edge to `automatic`; this only changes the value. `soft` is
          // the progressive fade. `hidden` at the bottom because the bottom of
          // the screen is the tab bar's buttons, and nothing is blurred over a
          // control.
          //
          // iOS 26 and above. Android has no equivalent and gets no edge.
          scrollEdgeEffects: {
            top: 'soft',
            bottom: 'hidden',
            left: 'automatic',
            right: 'automatic',
          },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="session" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="join-gym" />
        <Stack.Screen name="report" />
        <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Newsreader_500Medium,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <GymProvider>
              <LibraryProvider>
                <SessionProvider>
                  <Gate />
                </SessionProvider>
              </LibraryProvider>
            </GymProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
