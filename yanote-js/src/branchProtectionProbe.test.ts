import { describe, expect, it } from "vitest";

describe("branch protection probe", () => {
  it("fails intentionally for protection validation", () => {
    expect(1).toBe(2);
  });
});
