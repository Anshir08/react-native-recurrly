import clsx from "clsx";
import { useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

interface AuthFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helper?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  centered?: boolean;
  inputClassName?: string;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: TextInputProps["autoCorrect"];
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  returnKeyType?: TextInputProps["returnKeyType"];
  maxLength?: number;
  editable?: boolean;
  onSubmitEditing?: () => void;
}

const PLACEHOLDER_COLOR = "rgba(8, 17, 38, 0.35)";

const AuthField = ({
  label,
  value,
  onChangeText,
  error,
  helper,
  secureTextEntry,
  centered,
  inputClassName,
  ...inputProps
}: AuthFieldProps) => {
  const [hidden, setHidden] = useState(true);
  const isSecure = Boolean(secureTextEntry);

  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>

      <View className="auth-input-shell">
        <TextInput
          className={clsx(
            "auth-input",
            isSecure && "auth-input-affixed",
            error && "auth-input-error",
            inputClassName,
          )}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure && hidden}
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={centered ? { textAlign: "center" } : undefined}
          {...inputProps}
        />

        {isSecure && (
          <Pressable
            className="auth-input-affix"
            onPress={() => setHidden((prev) => !prev)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Text className="auth-input-affix-text">{hidden ? "Show" : "Hide"}</Text>
          </Pressable>
        )}
      </View>

      {error ? (
        <Text className="auth-error">{error}</Text>
      ) : helper ? (
        <Text className="auth-helper">{helper}</Text>
      ) : null}
    </View>
  );
};

export default AuthField;
