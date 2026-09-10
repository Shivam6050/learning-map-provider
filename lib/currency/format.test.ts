import { describe, it, expect } from "vitest";
import { formatMoney, displayAmount, isCurrency } from "./format";
describe("consistent money display", () => {
  it("formats INR and USD including free amounts", () => {
    expect(formatMoney(5000, "INR")).toBe("₹5,000");
    expect(formatMoney(0, "INR")).toBe("₹0");
    expect(formatMoney(0, "USD")).toBe("$0");
  });
  it("converts amounts instead of relabelling them", () => {
    expect(displayAmount(50, "USD", "INR", { "USD:INR": 85 })).toBe(4250);
    expect(displayAmount(50, "USD", "INR", {})).toBe(null);
    expect(displayAmount(0, "USD", "INR", {})).toBe(0);
    expect(displayAmount(50, "USD", "INR", { "USD:INR": -1 })).toBe(null);
  });
  it("validates saved preferences", () => {
    expect(isCurrency("INR")).toBe(true);
    expect(isCurrency("USD")).toBe(true);
    expect(isCurrency("BAD")).toBe(false);
  });
});
