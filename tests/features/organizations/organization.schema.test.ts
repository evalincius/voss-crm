import { describe, expect, it } from "vitest";
import { createOrgSchema } from "@/features/organizations/schemas/organization.schema";

describe("createOrgSchema", () => {
  it("passes with valid name only", () => {
    const result = createOrgSchema.safeParse({ name: "Acme Corp" });
    expect(result.success).toBe(true);
  });

  it("passes with valid name and slug", () => {
    const result = createOrgSchema.safeParse({ name: "Acme Corp", slug: "acme-corp" });
    expect(result.success).toBe(true);
  });

  it("passes with empty slug", () => {
    const result = createOrgSchema.safeParse({ name: "Acme Corp", slug: "" });
    expect(result.success).toBe(true);
  });

  it("fails with empty name", () => {
    const result = createOrgSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("fails with name shorter than 2 characters", () => {
    const result = createOrgSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });

  it("fails with slug containing uppercase letters", () => {
    const result = createOrgSchema.safeParse({ name: "Acme Corp", slug: "Acme-Corp" });
    expect(result.success).toBe(false);
  });

  it("fails with slug containing spaces", () => {
    const result = createOrgSchema.safeParse({ name: "Acme Corp", slug: "acme corp" });
    expect(result.success).toBe(false);
  });
});
