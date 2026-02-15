import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRange, mockInsertSingle, mockUpdateSingle, mockMaybeSingle } = vi.hoisted(() => ({
  mockRange: vi.fn(),
  mockInsertSingle: vi.fn(),
  mockUpdateSingle: vi.fn(),
  mockMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase", () => {
  const queryBuilder = {
    select: vi.fn(() => queryBuilder),
    eq: vi.fn(() => queryBuilder),
    or: vi.fn(() => queryBuilder),
    order: vi.fn(() => queryBuilder),
    range: mockRange,
    insert: vi.fn(() => ({
      select: vi.fn(() => ({ single: mockInsertSingle })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({ single: mockUpdateSingle })),
      })),
    })),
    limit: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
    maybeSingle: mockMaybeSingle,
  };

  return {
    supabase: {
      from: vi.fn(() => queryBuilder),
    },
  };
});

import { archivePerson, createPerson, listPeople } from "@/features/people/services/peopleService";

describe("peopleService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists people with total count", async () => {
    mockRange.mockResolvedValue({
      data: [{ id: "person-1", full_name: "Alice" }],
      count: 1,
      error: null,
    });

    const result = await listPeople({
      organizationId: "org-1",
      search: "",
      lifecycle: "all",
      archiveFilter: "active",
      sort: "updated_desc",
      page: 1,
      pageSize: 20,
    });

    expect(result.error).toBeNull();
    expect(result.data?.total).toBe(1);
    expect(result.data?.items).toHaveLength(1);
  });

  it("creates a person", async () => {
    mockInsertSingle.mockResolvedValue({ data: { id: "person-1" }, error: null });

    const result = await createPerson({
      organization_id: "org-1",
      full_name: "Alice",
      email: null,
      phone: null,
      notes: null,
      created_by: "user-1",
    });

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("person-1");
  });

  it("archives a person", async () => {
    mockUpdateSingle.mockResolvedValue({
      data: { id: "person-1", is_archived: true },
      error: null,
    });

    const result = await archivePerson("person-1");

    expect(result.error).toBeNull();
    expect(result.data?.is_archived).toBe(true);
  });
});
