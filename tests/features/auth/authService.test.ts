import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockSignInWithPassword, mockSignUp, mockSignOut } = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  },
}));

import { signInWithPassword, signUpWithEmail, signOut } from "@/features/auth/services/authService";

const fakeUser = { id: "user-1", email: "test@example.com" };
const fakeSession = { access_token: "token-123", user: fakeUser };

describe("signInWithPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns data on success", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    });

    const result = await signInWithPassword("test@example.com", "password");
    expect(result.error).toBeNull();
    expect(result.data?.user.email).toBe("test@example.com");
  });

  it("returns error on failure", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const result = await signInWithPassword("test@example.com", "wrong");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Invalid login credentials");
  });
});

describe("signUpWithEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns data on success", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    });

    const result = await signUpWithEmail("test@example.com", "Password1", "Test User");
    expect(result.error).toBeNull();
    expect(result.data?.user.email).toBe("test@example.com");
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "Password1",
      options: { data: { full_name: "Test User" } },
    });
  });

  it("returns error on failure", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });

    const result = await signUpWithEmail("test@example.com", "Password1", "Test User");
    expect(result.data).toBeNull();
    expect(result.error).toBe("User already registered");
  });

  it("returns error when no session returned", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: fakeUser, session: null },
      error: null,
    });

    const result = await signUpWithEmail("test@example.com", "Password1", "Test User");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Signup succeeded but no session was returned");
  });
});

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success on sign out", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const result = await signOut();
    expect(result.error).toBeNull();
  });

  it("returns error on failure", async () => {
    mockSignOut.mockResolvedValue({
      error: { message: "Sign out failed" },
    });

    const result = await signOut();
    expect(result.error).toBe("Sign out failed");
  });
});
