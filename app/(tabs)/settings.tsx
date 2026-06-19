import { useAuth, useUser } from "@clerk/expo";
import { styled } from "nativewind";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const posthog = usePostHog();
  const [signingOut, setSigningOut] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const displayName =
    user?.firstName || user?.username || email.split("@")[0] || "there";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      posthog.capture("user_signed_out");
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="settings-title">Settings</Text>

      <View className="settings-user-card">
        <View className="settings-avatar">
          <Text className="settings-avatar-text">{initial}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="settings-user-name" numberOfLines={1}>
            {displayName}
          </Text>
          {email ? (
            <Text className="settings-user-email" numberOfLines={1}>
              {email}
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        className="settings-signout"
        onPress={handleSignOut}
        disabled={signingOut}
        accessibilityRole="button"
      >
        {signingOut ? (
          <ActivityIndicator color="#dc2626" />
        ) : (
          <Text className="settings-signout-text">Sign out</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

export default Settings;
