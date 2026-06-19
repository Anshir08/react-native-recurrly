import clsx from "clsx";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { colors } from "@/constants/theme";

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

const AuthButton = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: AuthButtonProps) => {
  const isPrimary = variant === "primary";
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      className={clsx(
        isPrimary ? "auth-button" : "auth-secondary-button",
        isPrimary && isInactive && "auth-button-disabled",
      )}
      style={({ pressed }) => (pressed && !isInactive ? { opacity: 0.85 } : undefined)}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.primary : colors.accent} />
      ) : (
        <Text className={isPrimary ? "auth-button-text" : "auth-secondary-button-text"}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

export default AuthButton;
