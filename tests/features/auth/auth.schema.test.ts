import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/features/auth/schemas/auth.schema";

describe("loginSchema", () => {
  it("passes with valid input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("fails with invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("fails with empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  const validData = {
    fullName: "Jane Doe",
    email: "jane@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  };

  it("passes with valid data", () => {
    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails with short password", () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: "Pass1",
      confirmPassword: "Pass1",
    });
    expect(result.success).toBe(false);
  });

  it("fails when password is missing uppercase letter", () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("fails when password is missing lowercase letter", () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: "PASSWORD1",
      confirmPassword: "PASSWORD1",
    });
    expect(result.success).toBe(false);
  });

  it("fails when password is missing digit", () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("fails when passwords don't match", () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("fails with empty fullName", () => {
    const result = signupSchema.safeParse({
      ...validData,
      fullName: "",
    });
    expect(result.success).toBe(false);
  });
});
