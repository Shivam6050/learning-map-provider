import { getCountries, parsePhoneNumberFromString } from "libphonenumber-js/min";
import type { Currency } from "@/lib/currency/format";
const countries = new Set<string>(getCountries());
export function validCountry(value: unknown): value is string { return typeof value === "string" && countries.has(value); }
export function residenceCurrency(country: unknown): Currency {
 if (country === "IN") return "INR";
 return typeof country === "string" && "AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES BG".split(" ").includes(country) ? "EUR" : "USD";
}
export function internationalPhone(value: string): string | null {
 if (!value.trim().startsWith("+") || value.length > 40) return null;
 const phone = parsePhoneNumberFromString(value);
 return phone?.isValid() && !phone.ext ? phone.number : null;
}
export function countryOptions() {
 const names = new Intl.DisplayNames(["en"], {type:"region"});
 return [...countries].map(code => ({code, name:names.of(code) || code})).sort((a,b)=>a.name.localeCompare(b.name));
}
