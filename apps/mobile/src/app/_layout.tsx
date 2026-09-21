import { useEffect } from 'react';
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

SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { c, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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
          <GymProvider>
            <SessionProvider>
              <Navigator />
            </SessionProvider>
          </GymProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
