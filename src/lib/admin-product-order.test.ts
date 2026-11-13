import { describe, it, expect } from "vitest";
import { applyAdminOrder, reorderFullList } from "./admin-product-order";

describe("shared Admin ordering", () => {
  it("moves a product without removing any IDs", () => {
    expect(reorderFullList(["a", "b", "c"], ["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]);
  });
  it("rejects filtered views even if every product matches", () => {
    expect(reorderFullList(["a", "b"], ["a", "b"], "a", "b", true)).toBeNull();
  });
  it("rejects incomplete and differently sorted views", () => {
    expect(reorderFullList(["a", "b", "c"], ["a", "b"], "a", "b")).toBeNull();
    expect(reorderFullList(["a", "b"], ["b", "a"], "a", "b")).toBeNull();
  });
  it("uses the same persisted order and appends new products without changing data", () => {
    const products = [{ id: "a", price: 20 }, { id: "b", price: 30 }, { id: "c", price: 40 }];
    expect(applyAdminOrder(products, ["b", "a"])).toEqual([products[1], products[0], products[2]]);
    expect(products.map(p => p.id)).toEqual(["a", "b", "c"]);
  });
});