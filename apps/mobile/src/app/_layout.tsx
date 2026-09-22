import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
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

function Gate() {
  const { scheme } = useTheme();
  const { entered } = useAuth();
  // 0 is the gate, 1 is the app. Core Animated, so no worklets plugin is
  // needed for it to run.
  const progress = useRef(new Animated.Value(entered ? 1 : 0)).current;
  const [gateMounted, setGateMounted] = useState(!entered);

  useEffect(() => {
    if (entered) setGateMounted(true);
    const run = Animated.timing(progress, {
      toValue: entered ? 1 : 0,
      duration: GATE_MS,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    });
    run.start(({ finished }) => {
      if (finished && entered) setGateMounted(false);
    });
    return () => run.stop();
  }, [entered, progress]);

  const gateOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const gateLift = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const gateScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const appScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {entered ? (
        <Animated.View style={{ flex: 1, opacity: progress, transform: [{ scale: appScale }] }}>
          <Navigator />
        </Animated.View>
      ) : null}
      {gateMounted ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: gateOpacity, transform: [{ translateY: gateLift }, { scale: gateScale }] },
          ]}
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
