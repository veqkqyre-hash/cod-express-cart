import { describe, expect, it } from "vitest";
import { readSpecs, canBuyOption, optionPrice } from "./product-options";
import { cartKey } from "./cart";

describe("optional product configuration", () => {
  it("requires a variant before adding a variant product", () => {
    expect(canBuyOption(true, undefined, 100, 1)).toBe(false);
    expect(canBuyOption(false, undefined, 100, 1)).toBe(true);
  });
  it("uses separate variant stock rather than base product stock", () => {
    expect(canBuyOption(true, { active: true, stock: 2 }, 100, 3)).toBe(false);
    expect(canBuyOption(true, { active: true, stock: 2 }, 0, 2)).toBe(true);
    expect(canBuyOption(true, { active: false, stock: 2 }, 100, 1)).toBe(false);
  });
  it("uses optional variant price and falls back to the product price", () => {
    expect(optionPrice(18, { price: 22 })).toBe(22);
    expect(optionPrice(18, { price: null })).toBe(18);
    expect(optionPrice(18, { price: 0 })).toBe(0);
  });
  it("keeps two colour selections as distinct cart lines", () => {
    expect(cartKey({ id: "product", variantId: "red" })).not.toBe(cartKey({ id: "product", variantId: "blue" }));
    expect(cartKey({ id: "product" })).toBe(cartKey({ id: "product", variantId: null }));
  });
  it("has no specification rows for an unconfigured product", () => {
    expect(readSpecs({})).toEqual([]);
    expect(readSpecs({ Materiali: "Metal", Pesha: "" })).toEqual([{ name: "Materiali", value: "Metal" }]);
  });
});