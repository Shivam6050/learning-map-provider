import { describe, it, expect } from "vitest";
import { parseCourseOffer } from "./offer-parser";
import { isPaidCourseUrl } from "./providers";
const page = "https://www.geeksforgeeks.org/courses/python";
const markup = (changes = {}, courseChanges = {}) => `<script type="application/ld+json">${JSON.stringify({
  "@type": "Course", name: "Python", url: page,
  offers: { "@type": "Offer", price: "1499", priceCurrency: "INR", availability: "https://schema.org/InStock", ...changes }, ...courseChanges,
})}</script>`;
describe("provider offers", () => {
  it("reads the price and currency from the actual course offer", () => {
    expect(parseCourseOffer(markup(), page)).toEqual({ amount: 1499, currency: "INR", title: "Python" });
  });
  it("rejects missing currency, expired, unavailable and invalid offers", () => {
    for (const offer of [{ priceCurrency: undefined }, { price: "₹1499" }, { price: -1 }, { price: 0 }, { availability: "https://schema.org/OutOfStock" }, { priceValidUntil: "2000-01-01" }]) {
      expect(parseCourseOffer(markup(offer), page)).toBe(null);
    }
  });
  it("does not borrow a recommended course's price", () => {
    expect(parseCourseOffer(markup({}, { url: page + "-other" }), page)).toBe(null);
  });
  it("rejects recurring fees, instalments and ambiguous prices", () => {
    for (const description of ["Monthly subscription", "EMI available", "Free trial", "Pay per year"]) {
      expect(parseCourseOffer(markup({ description }), page)).toBe(null);
    }
    expect(parseCourseOffer(markup() + markup({ price: "1999" }), page)).toBe(null);
  });
  it("accepts only official course detail routes", () => {
    expect(isPaidCourseUrl("https://geeksforgeeks.org/courses/search?query=python")).toBe(false);
    expect(isPaidCourseUrl("https://udemy.com.evil.test/course/python")).toBe(false);
    expect(isPaidCourseUrl("https://campus.w3schools.com/products/python-course")).toBe(true);
    expect(isPaidCourseUrl("https://pwskills.com/course/python")).toBe(true);
  });
});
