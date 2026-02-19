import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: mockRpc,
  },
}));

import {
  commitTemplateMarkdownImport,
  previewTemplateMarkdownImport,
} from "@/features/library/templates/services/templatesService";

const row = {
  rowIndex: 1,
  sourceId: "source-1",
  fileName: "example.md",
  title: "Example",
  category: "content" as const,
  status: "draft" as const,
  body: "Hello",
};

describe("template markdown RPC services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps preview response rows", async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        total_requested: 1,
        valid_rows: 1,
        errors: 0,
        create_count: 1,
        rows: [
          {
            row_index: 1,
            source_id: "source-1",
            file_name: "example.md",
            title: "Example",
            category: "content",
            status: "draft",
            action: "create",
            template_id: null,
            resolved_product_ids: [],
            messages: [],
          },
        ],
      },
      error: null,
    });

    const result = await previewTemplateMarkdownImport({
      organizationId: "org-1",
      productId: "product-1",
      rows: [row],
    });

    expect(mockRpc).toHaveBeenCalledWith(
      "preview_bulk_template_markdown_import",
      expect.objectContaining({ p_product_id: "product-1" }),
    );
    expect(result.error).toBeNull();
    expect(result.data?.create_count).toBe(1);
    expect(result.data?.rows[0]?.action).toBe("create");
  });

  it("maps commit response rows", async () => {
    mockRpc.mockResolvedValueOnce({
      data: {
        mode: "partial",
        applied: true,
        total_requested: 1,
        created: 1,
        failed: 0,
        aborted: 0,
        rows: [
          {
            row_index: 1,
            source_id: "source-1",
            file_name: "example.md",
            title: "Example",
            dry_run_action: "create",
            action: "created",
            template_id: "template-1",
            messages: [],
          },
        ],
      },
      error: null,
    });

    const result = await commitTemplateMarkdownImport({
      organizationId: "org-1",
      productId: "product-1",
      rows: [row],
      commitMode: "partial",
    });

    expect(mockRpc).toHaveBeenCalledWith(
      "commit_bulk_template_markdown_import",
      expect.objectContaining({ p_product_id: "product-1" }),
    );
    expect(result.error).toBeNull();
    expect(result.data?.applied).toBe(true);
    expect(result.data?.rows[0]?.action).toBe("created");
  });
});
