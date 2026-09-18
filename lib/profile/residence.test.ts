import {expect,it} from "vitest";
import {validCountry,residenceCurrency,internationalPhone} from "./residence";
it("validates real countries, not arbitrary strings",()=>{expect(validCountry("IN")).toBe(true);expect(validCountry("ZZ")).toBe(false);expect(validCountry("in")).toBe(false)});
it("sets supported display defaults without inferring residence from phone",()=>{expect(residenceCurrency("IN")).toBe("INR");expect(residenceCurrency("DE")).toBe("EUR");expect(residenceCurrency("US")).toBe("USD")});
it("requires valid international numbers and rejects extensions",()=>{expect(internationalPhone("+1 202 555 0123")).toBe("+12025550123");expect(internationalPhone("2025550123")).toBeNull();expect(internationalPhone("+1 202 555 0123 ext 123")).toBeNull();expect(internationalPhone("+91 1")).toBeNull()});
