import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockList, mockInsertSingle, mockDeleteEqPerson } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockInsertSingle: vi.fn(),
  mockDeleteEqPerson: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table !== "interactions") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: mockList,
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: mockInsertSingle,
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: mockDeleteEqPerson,
            })),
          })),
        })),
      };
    }),
  },
}));

import {
  createInteraction,
  deleteInteraction,
  listInteractionsByPerson,
} from "@/features/interactions/services/interactionsService";

describe("interactionsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists interactions by person", async () => {
    mockList.mockResolvedValue({ data: [{ id: "interaction-1" }], error: null });

    const result = await listInteractionsByPerson("org-1", "person-1", "created_desc");

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it("creates an interaction", async () => {
    mockInsertSingle.mockResolvedValue({ data: { id: "interaction-1" }, error: null });

    const result = await createInteraction({
      organization_id: "org-1",
      person_id: "person-1",
      type: "note",
      summary: "Followed up",
      next_step_at: null,
      occurred_at: new Date().toISOString(),
      deal_id: null,
      campaign_id: null,
      template_id: null,
      product_id: null,
      created_by: "user-1",
    });

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("interaction-1");
  });

  it("deletes an interaction", async () => {
    mockDeleteEqPerson.mockResolvedValue({ error: null });

    const result = await deleteInteraction("interaction-1", "org-1", "person-1");

    expect(result.error).toBeNull();
  });
});
