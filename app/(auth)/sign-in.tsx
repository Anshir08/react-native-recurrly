import AuthButton from "@/components/auth/AuthButton";
import AuthField from "@/components/auth/AuthField";
import AuthShell from "@/components/auth/AuthShell";
import {
  fieldMessage,
  readClerkError,
  validateCode,
  validateEmail,
  validatePassword,
  type AuthFormErrors,
} from "@/lib/auth";
import { useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Stage = "credentials" | "mfa" | "forgot" | "reset";
type SecondFactor = "totp" | "phone_code" | "email_code";

const pickSecondFactor = (
  factors: ReadonlyArray<{ strategy: string }>,
): SecondFactor => {
  const strategies = factors.map((factor) => factor.strategy);
  if (strategies.includes("totp")) return "totp";
  if (strategies.includes("phone_code")) return "phone_code";
  return "email_code";
};

const SignIn = () => {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const posthog = usePostHog();

  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [secondFactor, setSecondFactor] = useState<SecondFactor>("email_code");
  const [local, setLocal] = useState<AuthFormErrors>({});

  const busy = fetchStatus === "fetching";

  const emailError = local.email ?? fieldMessage(errors.fields.identifier);
  const passwordError = local.password ?? fieldMessage(errors.fields.password);
  const codeError = local.code ?? fieldMessage(errors.fields.code);
  const hasFieldError = Boolean(emailError || passwordError || codeError);
  const formError = !hasFieldError
    ? (local.form ?? errors.global?.[0]?.message)
    : undefined;

  const completeSession = async () => {
    const { error } = await signIn.finalize();
    if (error) {
      setLocal({ form: readClerkError(error) });
      return;
    }
    posthog.capture("user_signed_in");
    router.replace("/(tabs)");
  };

  const handleSignIn = async () => {
    const nextEmail = validateEmail(email);
    const nextPassword = validatePassword(password);
    if (nextEmail || nextPassword) {
      setLocal({ email: nextEmail, password: nextPassword });
      return;
    }
    setLocal({});

    const { error } = await signIn.password({
      identifier: email.trim(),
      password,
    });
    if (error) {
      setLocal({ form: readClerkError(error) });
      posthog.capture("user_sign_in_failed", { error: readClerkError(error) });
      return;
    }

    if (signIn.status === "complete") {
      await completeSession();
      return;
    }

    if (signIn.status === "needs_second_factor") {
      const strategy = pickSecondFactor(signIn.supportedSecondFactors);
      setSecondFactor(strategy);
      setCode("");
      if (strategy === "email_code") await signIn.mfa.sendEmailCode();
      if (strategy === "phone_code") await signIn.mfa.sendPhoneCode();
      setStage("mfa");
      return;
    }

    setLocal({ form: "We couldn't sign you in. Please try again." });
  };

  const handleVerifyMfa = async () => {
    const nextCode = validateCode(code);
    if (nextCode) {
      setLocal({ code: nextCode });
      return;
    }
    setLocal({});

    const trimmed = code.trim();
    const { error } =
      secondFactor === "totp"
        ? await signIn.mfa.verifyTOTP({ code: trimmed })
        : secondFactor === "phone_code"
          ? await signIn.mfa.verifyPhoneCode({ code: trimmed })
          : await signIn.mfa.verifyEmailCode({ code: trimmed });

    if (error) {
      setLocal({ form: readClerkError(error) });
      return;
    }

    if (signIn.status === "complete") {
      await completeSession();
    }
  };

  const resendMfa = async () => {
    if (secondFactor === "email_code") await signIn.mfa.sendEmailCode();
    if (secondFactor === "phone_code") await signIn.mfa.sendPhoneCode();
  };

  const handleSendReset = async () => {
    const nextEmail = validateEmail(email);
    if (nextEmail) {
      setLocal({ email: nextEmail });
      return;
    }
    setLocal({});

    const created = await signIn.create({ identifier: email.trim() });
    if (created.error) {
      setLocal({ form: readClerkError(created.error) });
      return;
    }

    const sent = await signIn.resetPasswordEmailCode.sendCode();
    if (sent.error) {
      setLocal({ form: readClerkError(sent.error) });
      return;
    }

    setCode("");
    setPassword("");
    setStage("reset");
  };

  const handleResetPassword = async () => {
    const nextCode = validateCode(code);
    const nextPassword = validatePassword(password, { requireStrong: true });
    if (nextCode || nextPassword) {
      setLocal({ code: nextCode, password: nextPassword });
      return;
    }
    setLocal({});

    const verified = await signIn.resetPasswordEmailCode.verifyCode({
      code: code.trim(),
    });
    if (verified.error) {
      setLocal({ form: readClerkError(verified.error) });
      return;
    }

    const submitted = await signIn.resetPasswordEmailCode.submitPassword({
      password,
    });
    if (submitted.error) {
      setLocal({ form: readClerkError(submitted.error) });
      return;
    }

    if (signIn.status === "complete") {
      await completeSession();
    }
  };

  const goToStage = (next: Stage) => {
    setLocal({});
    setCode("");
    if (next === "credentials" || next === "forgot") setPassword("");
    setStage(next);
  };

  const renderBanner = () =>
    formError ? (
      <View className="auth-banner">
        <Text className="auth-banner-text">{formError}</Text>
      </View>
    ) : null;

  if (stage === "mfa") {
    const subtitle =
      secondFactor === "totp"
        ? "Enter the 6-digit code from your authenticator app."
        : secondFactor === "phone_code"
          ? "Enter the code we texted to your phone."
          : "Enter the code we emailed to verify it's you.";

    return (
      <AuthShell title="Two-step verification" subtitle={subtitle}>
        <View className="auth-form">
          <Pressable className="auth-back" onPress={() => goToStage("credentials")}>
            <Text className="auth-back-text">Back to sign in</Text>
          </Pressable>

          {renderBanner()}

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
            onSubmitEditing={handleVerifyMfa}
          />

          <AuthButton
            label="Verify and continue"
            onPress={handleVerifyMfa}
            loading={busy}
          />

          {secondFactor !== "totp" && (
            <View className="auth-resend-row">
              <Text className="auth-resend-copy">Didn&apos;t get a code?</Text>
              <Pressable onPress={resendMfa} hitSlop={8}>
                <Text className="auth-inline-link">Resend</Text>
              </Pressable>
            </View>
          )}
        </View>
      </AuthShell>
    );
  }

  if (stage === "forgot") {
    return (
      <AuthShell
        title="Reset your password"
        subtitle="Enter your email and we'll send you a code to set a new password."
      >
        <View className="auth-form">
          <Pressable className="auth-back" onPress={() => goToStage("credentials")}>
            <Text className="auth-back-text">Back to sign in</Text>
          </Pressable>

          {renderBanner()}

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
            returnKeyType="send"
            onSubmitEditing={handleSendReset}
          />

          <AuthButton label="Send reset code" onPress={handleSendReset} loading={busy} />
        </View>
      </AuthShell>
    );
  }

  if (stage === "reset") {
    return (
      <AuthShell
        title="Choose a new password"
        subtitle="Enter the code we sent and pick a new password."
      >
        <View className="auth-form">
          <Pressable className="auth-back" onPress={() => goToStage("forgot")}>
            <Text className="auth-back-text">Back</Text>
          </Pressable>

          {renderBanner()}

          <AuthField
            label="Verification code"
            value={code}
            onChangeText={setCode}
            error={codeError}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={8}
            textContentType="oneTimeCode"
            centered
            inputClassName="auth-input-code"
          />

          <AuthField
            label="New password"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            helper="At least 8 characters."
            placeholder="Create a new password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
          />

          <AuthButton
            label="Update password"
            onPress={handleResetPassword}
            loading={busy}
          />
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep every subscription in check."
      footer={
        <View className="auth-link-row">
          <Text className="auth-link-copy">New to recurrly?</Text>
          <Link href="/(auth)/sign-up" className="auth-link">
            Create an account
          </Link>
        </View>
      }
    >
      <View className="auth-form">
        {renderBanner()}

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
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          placeholder="Enter your password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
        />

        <View className="auth-meta-row">
          <Pressable onPress={() => goToStage("forgot")} hitSlop={8}>
            <Text className="auth-inline-link">Forgot password?</Text>
          </Pressable>
        </View>

        <AuthButton label="Sign in" onPress={handleSignIn} loading={busy} />
      </View>
    </AuthShell>
  );
};

export default SignIn;
