"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES, CURRENCY_COOKIE, isCurrency, formatMoney, displayAmount, type Currency } from "@/lib/currency/format";

const CurrencyContext = createContext<{
  currency: Currency | null;
  setCurrency: (currency: Currency) => void;
  rates: Record<string, number | null>;
}>({ currency: null, setCurrency: () => {}, rates: {} });

export function CurrencyProvider({ initialCurrency, rates, children }: {
  initialCurrency: Currency | null; rates: Record<string, number | null>; children: React.ReactNode;
}) {
  const [currency, setValue] = useState(initialCurrency);
  const router = useRouter();
  function setCurrency(value: Currency) {
    if (!isCurrency(value)) return;
    setValue(value);
    document.cookie = `${CURRENCY_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    router.refresh();
  }
  return <CurrencyContext.Provider value={{ currency, setCurrency, rates }}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);

export function RememberCurrency({ value }: { value: string }) {
  const { currency, setCurrency } = useCurrency();
  useEffect(() => { if (currency === null && isCurrency(value)) setCurrency(value); }, [currency, value, setCurrency]);
  return null;
}

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  return <select aria-label="Display currency" value={currency ?? "USD"} onChange={e => setCurrency(e.target.value as Currency)} className="currency-select rounded-lg border border-slate-700 px-2 py-1 text-xs">
    {CURRENCIES.map(value => <option key={value} value={value}>{value}</option>)}
  </select>;
}

export function Money({ amount, currency: source, freeLabel = false }: { amount: number; currency: string; freeLabel?: boolean }) {
  const { currency, rates } = useCurrency();
  const target = currency ?? source;
  const converted = displayAmount(Number(amount), source, target, rates);
  if (converted === null) return <span>Price unavailable ({target})</span>;
  return <span title={target !== source && amount > 0 ? "Converted estimate; provider checkout may differ." : undefined}>
    {freeLabel && converted === 0 ? `Free (${formatMoney(0, target)})` : formatMoney(converted, target)}
  </span>;
}
