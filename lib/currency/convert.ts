import { createServiceClient } from "@/lib/supabase/service";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours — exchange rates don't need to be second-fresh

/**
 * Fetches (or reuses a cached copy of) exchange rates for a base
 * currency, from frankfurter.app — European Central Bank reference
 * rates, free, no API key. Cached in Postgres, not an in-memory Map:
 * this codebase already learned that lesson once (see the deleted
 * lib/db/in-memory-paths.ts) — serverless instances don't share memory.
 */
async function getRates(baseCurrency: string): Promise<Record<string, number>> {
  const service = createServiceClient();

  const { data: cached } = await service
    .from("exchange_rates")
    .select("rates, fetched_at")
    .eq("base_currency", baseCurrency)
    .maybeSingle();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return cached.rates as Record<string, number>;
  }

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}`);
    if (!res.ok) throw new Error(`frankfurter.app returned ${res.status}`);
    const data = await res.json();
    const rates = data.rates as Record<string, number>;

    await service.from("exchange_rates").upsert(
      { base_currency: baseCurrency, rates, fetched_at: new Date().toISOString() },
      { onConflict: "base_currency" }
    );

    return rates;
  } catch (err) {
    console.error("[currency] failed to fetch rates:", err instanceof Error ? err.message : err);
    // Serve a stale cached value rather than nothing, if one exists —
    // a slightly-stale conversion is far less disruptive than the
    // price display breaking entirely.
    if (cached) return cached.rates as Record<string, number>;
    return {};
  }
}

/**
 * Converts an amount between currencies. Returns null (not a
 * fallback number) when conversion isn't possible, so callers can
 * decide how to degrade — e.g. show the original amount with its own
 * currency label instead of a wrong number.
 */
export async function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) return amount;
  if (amount === 0) return 0;

  const rates = await getRates(fromCurrency);
  const rate = rates[toCurrency];
  if (!rate) return null;

  return Math.round(amount * rate * 100) / 100;
}

/**
 * Fetches a single rate once, for callers converting many amounts on
 * one page (e.g. every resource price on a path) — one lookup instead
 * of one per resource.
 */
export async function getConversionRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) return 1;
  const rates = await getRates(fromCurrency);
  return rates[toCurrency] ?? null;
}
