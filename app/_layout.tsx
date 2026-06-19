import { ClerkLoaded, ClerkLoading, ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import "@/global.css";
import { colors } from "@/constants/theme";
import { posthog } from "@/lib/posthog";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { PostHogProvider, usePostHog } from "posthog-react-native";

export const unstable_settings = {
  anchor: "(tabs)",
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to your .env file.",
  );
}

SplashScreen.preventAutoHideAsync();

// Tracks the active Expo Router pathname as a PostHog $screen event.
// Must be rendered inside PostHogProvider and inside the Router (always true
// for _layout.tsx children).
function NavigationTracker() {
  const pathname = usePathname();
  const ph = usePostHog();

  useEffect(() => {
    ph.screen(pathname);
  }, [pathname]); // ph is a stable singleton — safe to omit from deps

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "sans-regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        // Screen tracking is handled manually via NavigationTracker because
        // @react-navigation/native v7 broke the autocapture hook.
        captureScreens: false,
        // Touch capture is off by default — enable if you want tap heatmaps.
        captureTouches: false,
      }}
    >
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkLoading>
          <View className="flex-1 items-center justify-center bg-background">
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </ClerkLoading>

        <ClerkLoaded>
          <NavigationTracker />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="subscriptions/[id]" />
          </Stack>
        </ClerkLoaded>
      </ClerkProvider>
    </PostHogProvider>
  );
}
