/**
 * The onboarding form collects a currency, not a country — using it as
 * a loose proxy for YouTube's regionCode is an approximation, not a
 * real locale signal. Good enough to bias results away from a
 * US-only default; not a substitute for actually asking the user's
 * country if that ever matters more precisely.
 */
const CURRENCY_TO_REGION: Record<string, string> = {
  USD: "US",
  INR: "IN",
  EUR: "DE", // EUR spans many countries; DE is a reasonable single proxy
};

export function currencyToRegion(currency: string): string {
  return CURRENCY_TO_REGION[currency] ?? "US";
}
