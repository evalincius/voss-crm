import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isHidden = false as boolean;
    expect(cn("base", isHidden && "hidden", "visible")).toBe("base visible");
  });

  it("resolves Tailwind conflicts", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });
});
