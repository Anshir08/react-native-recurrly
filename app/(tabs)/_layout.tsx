import { useAuth, useUser } from "@clerk/expo";
import { Redirect, Tabs } from "expo-router";
import { tabs } from "@/constants/data";
import { View, Image } from "react-native";
import { colors, components } from "@/constants/theme";
import clsx from "clsx";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";
import { useEffect } from "react";

const tabBar = components.tabBar;

const TabIcon = ({ focused, icon }: TabIconProps) => {
  return (
    <View className="tabs-icon">
      <View className={clsx("tabs-pill", focused && "tabs-active")}>
        <Image source={icon} resizeMode="contain" className="tabs-glyph" />
      </View>
    </View>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const posthog = usePostHog();

  // Identify the signed-in Clerk user so all PostHog events are linked to them.
  useEffect(() => {
    if (!user) return;

    // Build a props object with only defined string values; PostHog's JsonType
    // does not accept `undefined`, so we conditionally add each property.
    const props: Record<string, string> = {};
    if (user.primaryEmailAddress?.emailAddress) {
      props.email = user.primaryEmailAddress.emailAddress;
    }
    const displayName = user.firstName ?? user.username;
    if (displayName) {
      props.name = displayName;
    }

    posthog.identify(user.id, props);
  }, [user?.id]); // re-identify only when the user ID changes

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Math.max(insets.bottom, tabBar.horizontalInset),
          height: tabBar.height,
          marginHorizontal: tabBar.horizontalInset,
          borderRadius: tabBar.radius,
          backgroundColor: colors.primary,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarItemStyle: {
          paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6,
        },
        tabBarIconStyle: {
          width: tabBar.iconFrame,
          height: tabBar.iconFrame,
          alignItems: "center",
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={tab.icon} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
