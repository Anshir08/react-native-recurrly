import { styled } from "nativewind";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

const AuthShell = ({ title, subtitle, children, footer }: AuthShellProps) => {
  return (
    <SafeAreaView className="auth-safe-area" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-content">
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <Text className="auth-logo-mark-text">R</Text>
                </View>
                <View>
                  <Text className="auth-wordmark">recurrly</Text>
                  <Text className="auth-wordmark-sub">Subscriptions, simplified</Text>
                </View>
              </View>
            </View>

            <View className="auth-header">
              <Text className="auth-title">{title}</Text>
              <Text className="auth-subtitle">{subtitle}</Text>
            </View>

            <View className="auth-card">{children}</View>

            {footer}

            <View className="auth-trust-row">
              <View className="auth-trust-dot" />
              <Text className="auth-trust-text">
                Your data stays private and encrypted end to end.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthShell;
