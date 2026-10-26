"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "SGD", "AED", "THB", "CHF", "CNY", "KRW", "MXN", "BRL", "ZAR", "NZD", "SEK", "IDR", "MYR"];

const EURO = "AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK";
const BY_REGION: Record<string, string> = {
  US: "USD", GB: "GBP", IN: "INR", JP: "JPY", AU: "AUD", CA: "CAD", SG: "SGD", AE: "AED", TH: "THB", CH: "CHF",
  CN: "CNY", KR: "KRW", MX: "MXN", BR: "BRL", ZA: "ZAR", NZ: "NZD", SE: "SEK", ID: "IDR", MY: "MYR",
  ...Object.fromEntries(EURO.split(" ").map((r) => [r, "EUR"])),
};

/** Best guess from the browser locale, e.g. "en-IN" → INR. */
export function guessCurrency(): string {
  const region = (navigator.languages?.[0] ?? navigator.language ?? "").split("-")[1]?.toUpperCase();
  return (region && BY_REGION[region]) || "USD";
}

interface Ctx { currency: string; setCurrency: (c: string) => void; money: (usd: number) => string; updated: string | null; converted: boolean }
const Currency = createContext<Ctx>({ currency: "USD", setCurrency: () => {}, money: (n) => "$" + Math.round(n).toLocaleString("en-US"), updated: null, converted: false });
export const useCurrency = () => useContext(Currency);

const KEY = "currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCur] = useState("USD");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [updated, setUpdated] = useState<string | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* storage unavailable */ }
    setCur(saved && CURRENCIES.includes(saved) ? saved : guessCurrency());
    fetch("/api/rates").then((r) => r.json()).then((j) => { setRates(j.rates ?? { USD: 1 }); setUpdated(j.updated ?? null); }).catch(() => {});
  }, []);

  const value = useMemo<Ctx>(() => {
    // Fall back to USD when we have no rate for the chosen currency.
    const code = rates[currency] ? currency : "USD";
    const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 0 });
    return {
      currency, updated, converted: code !== "USD",
      setCurrency: (c) => { setCur(c); try { localStorage.setItem(KEY, c); } catch { /* ignore */ } },
      money: (usd) => fmt.format(usd * (rates[code] ?? 1)),
    };
  }, [currency, rates, updated]);

  return <Currency.Provider value={value}>{children}</Currency.Provider>;
}
