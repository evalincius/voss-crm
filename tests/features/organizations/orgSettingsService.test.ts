import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  mockRpc,
  mockSelect,
  mockUpdate,
  mockDeleteMemberEq,
  mockDeleteOrg,
  mockLeaveMember,
  mockInsert,
  mockUpdateOrg,
  mockUpdateStatus,
} = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
  mockDeleteMemberEq: vi.fn(),
  mockDeleteOrg: vi.fn(),
  mockLeaveMember: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdateOrg: vi.fn(),
  mockUpdateStatus: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: mockRpc,
    from: vi.fn((table: string) => {
      if (table === "organizations") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: mockUpdateOrg,
            })),
          })),
          delete: vi.fn(() => ({
            eq: mockDeleteOrg,
          })),
        };
      }
      if (table === "organization_members") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: mockSelect,
            })),
          })),
          update: vi.fn(() => ({
            eq: mockUpdate,
          })),
          delete: vi.fn(() => ({
            eq: vi.fn((_col: string) => {
              if (_col === "organization_id") {
                return { eq: mockLeaveMember };
              }
              // removeMember: .delete().eq("id", memberId) — terminal call
              return mockDeleteMemberEq() as unknown;
            }),
          })),
        };
      }
      if (table === "organization_invitations") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: mockInsert,
            })),
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: mockSelect,
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: mockUpdateStatus,
          })),
        };
      }
      return {};
    }),
  },
}));

import {
  updateOrganization,
  deleteOrganization,
  fetchMembers,
  updateMemberRole,
  removeMember,
  leaveOrganization,
  sendInvitation,
  fetchInvitations,
  revokeInvitation,
  validateInvitationToken,
  acceptInvitation,
} from "@/features/organizations/services/organizationService";

describe("updateOrganization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success", async () => {
    mockUpdateOrg.mockResolvedValue({ data: [{ id: "org-1" }], error: null });

    const result = await updateOrganization("org-1", "New Name");
    expect(result.error).toBeNull();
  });

  it("returns error on failure", async () => {
    mockUpdateOrg.mockResolvedValue({ data: null, error: { message: "Update failed" } });

    const result = await updateOrganization("org-1", "New Name");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Update failed");
  });

  it("returns error when no rows affected", async () => {
    mockUpdateOrg.mockResolvedValue({ data: [], error: null });

    const result = await updateOrganization("org-1", "New Name");
    expect(result.data).toBeNull();
    expect(result.error).toContain("not found");
  });
});

describe("deleteOrganization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success", async () => {
    mockDeleteOrg.mockResolvedValue({ error: null });

    const result = await deleteOrganization("org-1");
    expect(result.error).toBeNull();
  });

  it("returns error on failure", async () => {
    mockDeleteOrg.mockResolvedValue({ error: { message: "Delete failed" } });

    const result = await deleteOrganization("org-1");
    expect(result.error).toBe("Delete failed");
  });
});

describe("fetchMembers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns members on success", async () => {
    const members = [{ id: "m-1", user_id: "u-1", role: "owner" }];
    mockSelect.mockResolvedValue({ data: members, error: null });

    const result = await fetchMembers("org-1");
    expect(result.error).toBeNull();
    expect(result.data).toEqual(members);
  });

  it("returns error on failure", async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: "Fetch failed" } });

    const result = await fetchMembers("org-1");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Fetch failed");
  });
});

describe("updateMemberRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success", async () => {
    mockUpdate.mockResolvedValue({ error: null });

    const result = await updateMemberRole("m-1", "member");
    expect(result.error).toBeNull();
  });

  it("returns error on failure", async () => {
    mockUpdate.mockResolvedValue({ error: { message: "Role update failed" } });

    const result = await updateMemberRole("m-1", "member");
    expect(result.error).toBe("Role update failed");
  });
});

describe("removeMember", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success", async () => {
    mockDeleteMemberEq.mockReturnValue(Promise.resolve({ error: null }));

    const result = await removeMember("m-1");
    expect(result.error).toBeNull();
  });

  it("returns error on failure", async () => {
    mockDeleteMemberEq.mockReturnValue(Promise.resolve({ error: { message: "Remove failed" } }));

    const result = await removeMember("m-1");
    expect(result.error).toBe("Remove failed");
  });
});

describe("leaveOrganization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success", async () => {
    mockLeaveMember.mockResolvedValue({ error: null });

    const result = await leaveOrganization("org-1", "user-1");
    expect(result.error).toBeNull();
  });

  it("returns error on failure", async () => {
    mockLeaveMember.mockResolvedValue({ error: { message: "Leave failed" } });

    const result = await leaveOrganization("org-1", "user-1");
    expect(result.error).toBe("Leave failed");
  });
});

describe("sendInvitation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns invitation on success", async () => {
    const invitation = { id: "inv-1", email: "user@example.com" };
    mockInsert.mockResolvedValue({ data: invitation, error: null });

    const result = await sendInvitation("org-1", "user@example.com", "member", "user-1");
    expect(result.error).toBeNull();
    expect(result.data).toEqual(invitation);
  });

  it("returns error on failure", async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: "Insert failed" } });

    const result = await sendInvitation("org-1", "user@example.com", "member", "user-1");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Insert failed");
  });
});

describe("fetchInvitations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns invitations on success", async () => {
    const invitations = [{ id: "inv-1", email: "user@example.com", status: "pending" }];
    mockSelect.mockResolvedValue({ data: invitations, error: null });

    const result = await fetchInvitations("org-1");
    expect(result.error).toBeNull();
    expect(result.data).toEqual(invitations);
  });

  it("returns error on failure", async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: "Fetch failed" } });

    const result = await fetchInvitations("org-1");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Fetch failed");
  });
});

describe("revokeInvitation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success", async () => {
    mockUpdateStatus.mockResolvedValue({ error: null });

    const result = await revokeInvitation("inv-1");
    expect(result.error).toBeNull();
  });

  it("returns error on failure", async () => {
    mockUpdateStatus.mockResolvedValue({ error: { message: "Revoke failed" } });

    const result = await revokeInvitation("inv-1");
    expect(result.error).toBe("Revoke failed");
  });
});

describe("validateInvitationToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns validation result on success", async () => {
    const validation = { valid: true, organization_name: "Acme", role: "member" };
    mockRpc.mockResolvedValue({ data: validation, error: null });

    const result = await validateInvitationToken("token-123");
    expect(result.error).toBeNull();
    expect(result.data).toEqual(validation);
    expect(mockRpc).toHaveBeenCalledWith("validate_invitation_token", {
      invitation_token: "token-123",
    });
  });

  it("returns error on failure", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "RPC failed" } });

    const result = await validateInvitationToken("token-123");
    expect(result.data).toBeNull();
    expect(result.error).toBe("RPC failed");
  });
});

describe("acceptInvitation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns result on success", async () => {
    const acceptResult = { success: true, organization_id: "org-1", organization_name: "Acme" };
    mockRpc.mockResolvedValue({ data: acceptResult, error: null });

    const result = await acceptInvitation("token-123");
    expect(result.error).toBeNull();
    expect(result.data).toEqual(acceptResult);
    expect(mockRpc).toHaveBeenCalledWith("accept_invitation", {
      invitation_token: "token-123",
    });
  });

  it("returns error on failure", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "Accept failed" } });

    const result = await acceptInvitation("token-123");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Accept failed");
  });
});
