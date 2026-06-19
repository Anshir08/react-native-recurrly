import AuthButton from "@/components/auth/AuthButton";
import AuthField from "@/components/auth/AuthField";
import AuthShell from "@/components/auth/AuthShell";
import {
  fieldMessage,
  readClerkError,
  validateCode,
  validateEmail,
  validatePassword,
  validateUsername,
  type AuthFormErrors,
} from "@/lib/auth";
import { useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Stage = "details" | "verify";

const SignUp = () => {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const posthog = usePostHog();

  const [stage, setStage] = useState<Stage>("details");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [local, setLocal] = useState<AuthFormErrors>({});

  const busy = fetchStatus === "fetching";

  const emailError = local.email ?? fieldMessage(errors.fields.emailAddress);
  const passwordError = local.password ?? fieldMessage(errors.fields.password);
  const codeError = local.code ?? fieldMessage(errors.fields.code);
  const hasFieldError = Boolean(emailError || passwordError || codeError);
  const formError = !hasFieldError
    ? (local.form ?? errors.global?.[0]?.message)
    : undefined;

  const usernameError = local.username ?? fieldMessage(errors.fields.username);

  const completeSession = async () => {
    const { error } = await signUp.finalize();
    if (error) {
      setLocal({ form: readClerkError(error) });
      posthog.capture("user_sign_up_failed", { step: "finalize", error: readClerkError(error) });
      return;
    }
    posthog.capture("user_signed_up");
    router.replace("/(tabs)");
  };

  const handleSignUp = async () => {
    const nextEmail = validateEmail(email);
    const nextUsername = validateUsername(username);
    const nextPassword = validatePassword(password, { requireStrong: true });
    if (nextEmail || nextUsername || nextPassword) {
      setLocal({ email: nextEmail, username: nextUsername, password: nextPassword });
      return;
    }
    setLocal({});

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      username: username.trim(),
      password,
    });
    if (error) {
      setLocal({ form: readClerkError(error) });
      posthog.capture("user_sign_up_failed", { step: "password", error: readClerkError(error) });
      return;
    }

    if (signUp.status === "complete") {
      await completeSession();
      return;
    }

    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) {
      setLocal({ form: readClerkError(sent.error) });
      return;
    }

    setCode("");
    setStage("verify");
  };

  const handleVerify = async () => {
    const nextCode = validateCode(code);
    if (nextCode) {
      setLocal({ code: nextCode });
      return;
    }
    setLocal({});

    const { error } = await signUp.verifications.verifyEmailCode({
      code: code.trim(),
    });
    if (error) {
      setLocal({ form: readClerkError(error) });
      posthog.capture("user_sign_up_failed", { step: "verify", error: readClerkError(error) });
      return;
    }

    if (signUp.status === "complete") {
      await completeSession();
    }
  };

  const resendCode = async () => {
    await signUp.verifications.sendEmailCode();
  };

  if (stage === "verify") {
    return (
      <AuthShell
        title="Verify your email"
        subtitle={`We sent a code to ${email.trim()}. Enter it below to finish.`}
      >
        <View className="auth-form">
          <Pressable
            className="auth-back"
            onPress={() => {
              setLocal({});
              setCode("");
              setStage("details");
            }}
          >
            <Text className="auth-back-text">Back</Text>
          </Pressable>

          {formError ? (
            <View className="auth-banner">
              <Text className="auth-banner-text">{formError}</Text>
            </View>
          ) : null}

          <AuthField
            label="Verification code"
            value={code}
            onChangeText={setCode}
            error={codeError}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={8}
            textContentType="oneTimeCode"
            returnKeyType="done"
            centered
            inputClassName="auth-input-code"
            onSubmitEditing={handleVerify}
          />

          <AuthButton label="Create account" onPress={handleVerify} loading={busy} />

          <View className="auth-resend-row">
            <Text className="auth-resend-copy">Didn&apos;t get a code?</Text>
            <Pressable onPress={resendCode} hitSlop={8}>
              <Text className="auth-inline-link">Resend</Text>
            </Pressable>
          </View>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track renewals, spot waste, and take back control of your spend."
      footer={
        <View className="auth-link-row">
          <Text className="auth-link-copy">Already have an account?</Text>
          <Link href="/(auth)/sign-in" className="auth-link">
            Sign in
          </Link>
        </View>
      }
    >
      <View className="auth-form">
        {formError ? (
          <View className="auth-banner">
            <Text className="auth-banner-text">{formError}</Text>
          </View>
        ) : null}

        <AuthField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />

        <AuthField
          label="Username"
          value={username}
          onChangeText={setUsername}
          error={usernameError}
          placeholder="e.g. johndoe"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          textContentType="username"
          returnKeyType="next"
        />

        <AuthField
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          helper="At least 8 characters."
          placeholder="Create a password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSignUp}
        />

        <AuthButton label="Create account" onPress={handleSignUp} loading={busy} />

        <View nativeID="clerk-captcha" />
      </View>
    </AuthShell>
  );
};

export default SignUp;
