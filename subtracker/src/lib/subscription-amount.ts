export function formatSubscriptionAmount(amountMinor: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}
