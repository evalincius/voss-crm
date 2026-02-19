import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCommitTemplateMarkdownImport, mockPreviewTemplateMarkdownImport } = vi.hoisted(() => ({
  mockCommitTemplateMarkdownImport: vi.fn(),
  mockPreviewTemplateMarkdownImport: vi.fn(),
}));

vi.mock("@/features/library/templates/services/templatesService", () => ({
  commitTemplateMarkdownImport: mockCommitTemplateMarkdownImport,
  createTemplate: vi.fn(),
  getTemplateById: vi.fn(),
  getTemplateLinkedProductIds: vi.fn(),
  getTemplateUsedInSummary: vi.fn(),
  listTemplateProductOptions: vi.fn(),
  listTemplates: vi.fn(),
  previewTemplateMarkdownImport: mockPreviewTemplateMarkdownImport,
  setTemplateStatus: vi.fn(),
  syncTemplateProducts: vi.fn(),
  updateTemplate: vi.fn(),
}));

import {
  useCommitTemplateMarkdownImport,
  usePreviewTemplateMarkdownImport,
} from "@/features/library/templates/hooks/useTemplates";
import { templateKeys } from "@/lib/queryKeys";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
}

const input = {
  organizationId: "org-1",
  rows: [
    {
      rowIndex: 1,
      sourceId: "source-1",
      fileName: "template.md",
      title: "Template",
      category: "content" as const,
      status: "draft" as const,
      body: "Body",
    },
  ],
  productId: "product-1",
  commitMode: "partial" as const,
};

describe("template markdown import hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards preview response", async () => {
    mockPreviewTemplateMarkdownImport.mockResolvedValue({
      data: {
        total_requested: 1,
        valid_rows: 1,
        errors: 0,
        create_count: 1,
        rows: [],
      },
      error: null,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePreviewTemplateMarkdownImport(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        organizationId: input.organizationId,
        productId: input.productId,
        rows: input.rows,
      });
    });

    expect(mockPreviewTemplateMarkdownImport).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "product-1" }),
    );
  });

  it("invalidates template caches after applied commit", async () => {
    mockCommitTemplateMarkdownImport.mockResolvedValue({
      data: {
        mode: "partial",
        applied: true,
        total_requested: 1,
        created: 1,
        failed: 0,
        aborted: 0,
        rows: [],
      },
      error: null,
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useCommitTemplateMarkdownImport(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: templateKeys.list._def }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: templateKeys.productOptions._def }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: templateKeys.detail._def }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: templateKeys.productLinks._def }),
    );
  });

  it("skips invalidation when commit is not applied", async () => {
    mockCommitTemplateMarkdownImport.mockResolvedValue({
      data: {
        mode: "abort_all",
        applied: false,
        total_requested: 1,
        created: 0,
        failed: 1,
        aborted: 0,
        rows: [],
      },
      error: null,
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useCommitTemplateMarkdownImport(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ ...input, commitMode: "abort_all" });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
