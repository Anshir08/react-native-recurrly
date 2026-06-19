import dayjs from "dayjs";

export function formatCurrency(
  value: number,
  currency: string = "USD",
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}

export const formatSubscriptionDateTime = (value?: string): string => {
  if (!value) return "Not Provided";
  const parsedDate = dayjs(value);
  return parsedDate.isValid() ? parsedDate.format("MM/DD/YYYY") : "Invalid Date";
}

export const formatStatusLabel = (value?: string): string => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export function filterSubscriptions(
  subscriptions: Subscription[],
  query: string,
): Subscription[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return subscriptions;

  return subscriptions.filter((subscription) => {
    const searchableText = [
      subscription.name,
      subscription.category,
      subscription.plan,
      subscription.billing,
      subscription.status,
      subscription.paymentMethod,
      subscription.currency,
      String(subscription.price),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}

