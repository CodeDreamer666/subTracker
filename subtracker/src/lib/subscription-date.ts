/** Stores a date-only value (YYYY-MM-DD) at UTC midnight, matching @db.Date. */
export function subscriptionDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatSubscriptionDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}
