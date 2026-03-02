import { describe, expect, it } from "vitest";
import { runCli } from "./cli.js";

describe("cli", () => {
  it("prints help", async () => {
    const res = await runCli(["--help"]);
    expect(res.code).toBe(0);
    expect(res.stdout).toContain("Compute coverage");
    expect(res.stdout).toContain("report");
  });
});

