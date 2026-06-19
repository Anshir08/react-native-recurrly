const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 8;

export interface AuthFormErrors {
  email?: string;
  username?: string;
  password?: string;
  code?: string;
  form?: string;
}

export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return "Enter your email address.";
  if (!EMAIL_REGEX.test(value)) return "That email doesn't look right.";
  return undefined;
}

export function validatePassword(
  password: string,
  options: { requireStrong?: boolean } = {},
): string | undefined {
  if (!password) return "Enter your password.";
  if (options.requireStrong && password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return undefined;
}

export function validateUsername(username: string): string | undefined {
  const value = username.trim();
  if (!value) return "Choose a username.";
  if (value.length < 3) return "At least 3 characters.";
  if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Letters, numbers, and underscores only.";
  return undefined;
}

export function validateCode(code: string): string | undefined {
  const value = code.trim();
  if (!value) return "Enter the verification code.";
  if (!/^\d{4,8}$/.test(value)) return "Enter the code we sent you.";
  return undefined;
}

interface MessageLike {
  message?: string;
  longMessage?: string;
}

/** Reads the most user-friendly message off a Clerk field error (or null). */
export function fieldMessage(field: MessageLike | null | undefined): string | undefined {
  if (!field) return undefined;
  return field.longMessage || field.message || undefined;
}

/** Reads a readable message off a returned Clerk error, with a safe fallback. */
export function readClerkError(error: unknown): string {
  const candidate = error as MessageLike | null | undefined;
  return (
    candidate?.longMessage ||
    candidate?.message ||
    "Something went wrong. Please try again."
  );
}
