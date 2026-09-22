import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
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
import { LibraryProvider } from '../library/library';

SplashScreen.preventAutoHideAsync();

/**
 * The app opens on sign-in; Continue is what gets you past it.
 *
 * Signing in is not a cut. The gate lifts: it fades and rises a little while
 * the app settles in from just below full size underneath it. One movement,
 * answering the tap, and nothing animates after it.
 */
/**
 * Signing in lifts a pane of glass off the app.
 *
 * Following the apple-design skill: the gate is a real translucent material
 * over the app, not a second screen. It does not merely fade — blur radius,
 * scale and opacity move together, so the glass reads as a material leaving
 * rather than a layer being cross-faded (§12, "materialize, don't just
 * fade"). The motion is a spring, not a fixed curve, so it stays
 * interruptible and can be re-targeted mid-flight (§4).
 */
const GLASS_BLUR = 48;
const SPRING = { stiffness: 140, damping: 22, mass: 1, useNativeDriver: true } as const;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

function Gate() {
  const { c, scheme } = useTheme();
  const { entered } = useAuth();
  // Transforms and opacity run on the native driver; blur radius cannot, so
  // it gets its own value driven with the same spring.
  const lift = useRef(new Animated.Value(entered ? 1 : 0)).current;
  const glass = useRef(new Animated.Value(entered ? 0 : 1)).current;
  const [gateMounted, setGateMounted] = useState(!entered);
  const [solid, setSolid] = useState(false);

  // Reduced transparency: a frosted pane becomes a solid one (§14).
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
    if (entered) setGateMounted(true);
    const to = entered ? 1 : 0;
    const run = Animated.parallel([
      Animated.spring(lift, { ...SPRING, toValue: to }),
      Animated.spring(glass, { ...SPRING, toValue: 1 - to, useNativeDriver: false }),
    ]);
    run.start(({ finished }) => {
      if (finished && entered) setGateMounted(false);
    });
    return () => run.stop();
  }, [entered, lift, glass]);

  const intensity = glass.interpolate({ inputRange: [0, 1], outputRange: [0, GLASS_BLUR] });
  const glassOpacity = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  // The pane pulls toward the viewer as it goes, the way glass lifts away.
  const glassScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const appScale = lift.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Animated.View style={{ flex: 1, opacity: lift, transform: [{ scale: appScale }] }}>
        <Navigator />
      </Animated.View>
      {gateMounted ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: glassOpacity, transform: [{ scale: glassScale }] },
          ]}
          pointerEvents={entered ? 'none' : 'auto'}
        >
          <AnimatedBlurView
            intensity={solid ? GLASS_BLUR : intensity}
            tint={scheme === 'dark' ? 'systemMaterialDark' : 'systemMaterialLight'}
            style={[
              StyleSheet.absoluteFill,
              // The material is tinted with the app's own background so the
              // glass belongs to Alke rather than to the system.
              { backgroundColor: solid ? c.bg : `${c.bg}D8` },
            ]}
          >
            <SignIn onGlass />
          </AnimatedBlurView>
        </Animated.View>
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
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
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
