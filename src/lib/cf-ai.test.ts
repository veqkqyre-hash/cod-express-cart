import { describe, it, expect } from "vitest";
import { aiErrorMessage } from "./cf-ai";
describe("aiErrorMessage", () => {
  it("shows quota message on 429", () => expect(aiErrorMessage(429, "")).toMatch(/Kuota falas/));
});
