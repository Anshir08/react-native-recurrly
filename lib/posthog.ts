import PostHog from "posthog-react-native";

const key = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "";
const host =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// Disabled when no key is present (e.g. local dev before you add the key).
export const posthog = new PostHog(key, {
  host,
  disabled: !key,
  // Flush quickly in dev so you see events in PostHog immediately.
  flushAt: __DEV__ ? 1 : 20,
  flushInterval: __DEV__ ? 0 : 10_000,
});
