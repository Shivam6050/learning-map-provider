export const CURRENCIES = ["USD", "INR", "EUR"] as const;
export type Currency = typeof CURRENCIES[number];
export const CURRENCY_COOKIE = "learning-map-currency";
export function isCurrency(value: unknown): value is Currency {
  return CURRENCIES.includes(value as Currency);
}
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency", currency, maximumFractionDigits: 2, minimumFractionDigits: 0,
  }).format(amount);
}
export function displayAmount(amount: number, from: string, to: string, rates: Record<string, number | null>): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  if (amount === 0 || from === to) return amount;
  const rate = rates[`${from}:${to}`];
  return rate && Number.isFinite(rate) && rate > 0 ? Math.round(amount * rate * 100) / 100 : null;
}
