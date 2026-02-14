import { describe, expect, it } from "vitest";
import {
  updateOrgSchema,
  inviteMemberSchema,
} from "@/features/organizations/schemas/orgSettings.schema";

describe("updateOrgSchema", () => {
  it("accepts valid name", () => {
    const result = updateOrgSchema.safeParse({ name: "Acme Corp" });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = updateOrgSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 chars", () => {
    const result = updateOrgSchema.safeParse({ name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = updateOrgSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("accepts valid email and role", () => {
    const result = inviteMemberSchema.safeParse({
      email: "user@example.com",
      role: "member",
    });
    expect(result.success).toBe(true);
  });

  it("accepts owner role", () => {
    const result = inviteMemberSchema.safeParse({
      email: "user@example.com",
      role: "owner",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = inviteMemberSchema.safeParse({
      email: "not-an-email",
      role: "member",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = inviteMemberSchema.safeParse({
      email: "user@example.com",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = inviteMemberSchema.safeParse({ role: "member" });
    expect(result.success).toBe(false);
  });
});
