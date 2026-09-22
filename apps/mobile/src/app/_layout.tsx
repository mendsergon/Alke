import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
const GATE_MS = 420;
const GATE_EASING = Easing.bezier(0.22, 1, 0.36, 1);

function Gate() {
  const { scheme } = useTheme();
  const { entered } = useAuth();
  // 0 is the gate, 1 is the app. Kept mounted through the fade, then dropped.
  const progress = useSharedValue(entered ? 1 : 0);
  const [gateMounted, setGateMounted] = useState(!entered);

  useEffect(() => {
    if (entered) {
      progress.value = withTiming(1, { duration: GATE_MS, easing: GATE_EASING }, (done) => {
        if (done) runOnJS(setGateMounted)(false);
      });
    } else {
      setGateMounted(true);
      progress.value = withTiming(0, { duration: GATE_MS, easing: GATE_EASING });
    }
  }, [entered, progress]);

  const gateStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateY: -12 * progress.value }, { scale: 1 + 0.02 * progress.value }],
  }));

  const appStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.98 + 0.02 * progress.value }],
  }));

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {entered ? (
        <Animated.View style={[{ flex: 1 }, appStyle]}>
          <Navigator />
        </Animated.View>
      ) : null}
      {gateMounted ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, gateStyle]}
          pointerEvents={entered ? 'none' : 'auto'}
        >
          <SignIn />
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
