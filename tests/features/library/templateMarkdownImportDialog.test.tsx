import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";

const { mockParseTemplateMarkdownFiles, mockPreviewMutateAsync, mockCommitMutateAsync } =
  vi.hoisted(() => ({
    mockParseTemplateMarkdownFiles: vi.fn(),
    mockPreviewMutateAsync: vi.fn(),
    mockCommitMutateAsync: vi.fn(),
  }));

vi.mock("@/features/library/templates/services/templateMarkdownImportService", () => ({
  parseTemplateMarkdownFiles: mockParseTemplateMarkdownFiles,
}));

vi.mock("@/features/library/templates/hooks/useTemplates", () => ({
  usePreviewTemplateMarkdownImport: () => ({
    mutateAsync: mockPreviewMutateAsync,
    isPending: false,
  }),
  useCommitTemplateMarkdownImport: () => ({
    mutateAsync: mockCommitMutateAsync,
    isPending: false,
  }),
  useTemplateProductOptions: () => ({
    isLoading: false,
    isError: false,
    data: [{ id: "product-1", name: "Starter Plan" }],
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

import { TemplateMarkdownImportDialog } from "@/features/library/templates/components/TemplateMarkdownImportDialog";

describe("TemplateMarkdownImportDialog", () => {
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockParseTemplateMarkdownFiles.mockResolvedValue({
      rows: [
        {
          rowIndex: 1,
          sourceId: "source-1",
          fileName: "template.md",
          title: "Template",
          category: "content",
          status: "draft",
          body: "Body",
        },
      ],
      errors: [],
    });

    mockPreviewMutateAsync.mockResolvedValue({
      total_requested: 1,
      valid_rows: 1,
      errors: 0,
      create_count: 1,
      rows: [
        {
          row_index: 1,
          source_id: "source-1",
          file_name: "template.md",
          title: "Template",
          category: "content",
          status: "draft",
          action: "create",
          template_id: null,
          resolved_product_ids: ["product-1"],
          messages: [],
        },
      ],
    });

    mockCommitMutateAsync.mockResolvedValue({
      result: {
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
            file_name: "template.md",
            title: "Template",
            dry_run_action: "create",
            action: "created",
            template_id: "template-1",
            messages: [],
          },
        ],
      },
    });
  });

  async function uploadOneFile() {
    const fileInput = screen.getByLabelText("Markdown files");
    const file = new File(["hello"], "template.md", { type: "text/markdown" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockParseTemplateMarkdownFiles).toHaveBeenCalled();
    });
  }

  async function selectProduct() {
    fireEvent.click(screen.getByRole("combobox", { name: "Product *" }));
    fireEvent.click(await screen.findByText("Starter Plan"));
  }

  it("runs preflight and auto-commits when no errors", async () => {
    render(<TemplateMarkdownImportDialog open onOpenChange={vi.fn()} organizationId="org-1" />);

    await uploadOneFile();
    await selectProduct();

    fireEvent.click(screen.getByRole("button", { name: "Create templates" }));

    await waitFor(() => {
      expect(mockPreviewMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ productId: "product-1" }),
      );
    });

    await waitFor(() => {
      expect(mockCommitMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ commitMode: "partial", productId: "product-1" }),
      );
    });

    expect(screen.queryByRole("combobox", { name: /commit mode/i })).not.toBeInTheDocument();
    expect(screen.queryByText("linked_product_ids")).not.toBeInTheDocument();
    expect(screen.queryByText("linked_product_names")).not.toBeInTheDocument();
  });

  it("shows partial confirmation when preflight has mixed valid and error rows", async () => {
    mockPreviewMutateAsync.mockResolvedValueOnce({
      total_requested: 1,
      valid_rows: 1,
      errors: 1,
      create_count: 1,
      rows: [
        {
          row_index: 1,
          source_id: "source-1",
          file_name: "template.md",
          title: "Template",
          category: "content",
          status: "draft",
          action: "create",
          template_id: null,
          resolved_product_ids: ["product-1"],
          messages: ['duplicate title found; will create "Template (1)"'],
        },
      ],
    });

    render(<TemplateMarkdownImportDialog open onOpenChange={vi.fn()} organizationId="org-1" />);

    await uploadOneFile();
    await selectProduct();

    fireEvent.click(screen.getByRole("button", { name: "Create templates" }));

    await waitFor(() => {
      expect(mockPreviewMutateAsync).toHaveBeenCalled();
    });

    expect(mockCommitMutateAsync).not.toHaveBeenCalled();
    expect(screen.getByText("Create valid templates only?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create valid only" }));

    await waitFor(() => {
      expect(mockCommitMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ commitMode: "partial", productId: "product-1" }),
      );
    });
  });

  it("keeps create action disabled until a product is selected", async () => {
    render(<TemplateMarkdownImportDialog open onOpenChange={vi.fn()} organizationId="org-1" />);

    await uploadOneFile();

    expect(screen.getByRole("button", { name: "Create templates" })).toBeDisabled();
  });
});
