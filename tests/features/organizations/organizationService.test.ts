import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockRpc, mockSelect, mockUpdate } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: mockRpc,
    from: vi.fn((table: string) => {
      if (table === "organizations") {
        return {
          select: vi.fn(() => ({
            in: mockSelect,
          })),
        };
      }
      if (table === "profiles") {
        return {
          update: vi.fn(() => ({
            eq: mockUpdate,
          })),
        };
      }
      return {};
    }),
  },
}));

import {
  getUserOrganizationIds,
  getUserCurrentOrganizationId,
  getOrganizationsByIds,
  setCurrentOrganization,
  createOrganization,
} from "@/features/organizations/services/organizationService";

describe("getUserOrganizationIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns org ids on success", async () => {
    mockRpc.mockResolvedValue({ data: ["org-1", "org-2"], error: null });

    const result = await getUserOrganizationIds();
    expect(result.error).toBeNull();
    expect(result.data).toEqual(["org-1", "org-2"]);
    expect(mockRpc).toHaveBeenCalledWith("user_organization_ids");
  });

  it("returns error on failure", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "RPC failed" } });

    const result = await getUserOrganizationIds();
    expect(result.data).toBeNull();
    expect(result.error).toBe("RPC failed");
  });
});

describe("getUserCurrentOrganizationId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns current org id on success", async () => {
    mockRpc.mockResolvedValue({ data: "org-1", error: null });

    const result = await getUserCurrentOrganizationId();
    expect(result.error).toBeNull();
    expect(result.data).toBe("org-1");
  });

  it("returns null when no current org", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await getUserCurrentOrganizationId();
    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("getOrganizationsByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array for empty ids", async () => {
    const result = await getOrganizationsByIds([]);
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("returns organizations on success", async () => {
    const orgs = [{ id: "org-1", name: "Acme" }];
    mockSelect.mockResolvedValue({ data: orgs, error: null });

    const result = await getOrganizationsByIds(["org-1"]);
    expect(result.error).toBeNull();
    expect(result.data).toEqual(orgs);
  });
});

describe("setCurrentOrganization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success", async () => {
    mockUpdate.mockResolvedValue({ error: null });

    const result = await setCurrentOrganization("user-1", "org-1");
    expect(result.error).toBeNull();
  });

  it("returns error on failure", async () => {
    mockUpdate.mockResolvedValue({ error: { message: "Update failed" } });

    const result = await setCurrentOrganization("user-1", "org-1");
    expect(result.error).toBe("Update failed");
  });
});

describe("createOrganization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns created org on success", async () => {
    const created = { success: true, id: "org-new", name: "New Org", slug: "new-org" };
    mockRpc.mockResolvedValue({ data: created, error: null });

    const result = await createOrganization("New Org", "new-org");
    expect(result.error).toBeNull();
    expect(result.data).toEqual(created);
    expect(mockRpc).toHaveBeenCalledWith("create_organization_with_membership", {
      org_name: "New Org",
      org_slug: "new-org",
    });
  });

  it("returns error on failure", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "Create failed" } });

    const result = await createOrganization("New Org");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Create failed");
  });
});
