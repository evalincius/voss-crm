import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  mockUseTemplatesList,
  mockUseTemplateProductOptions,
  mockUseSetTemplateStatus,
  mockTemplateImportDialog,
} = vi.hoisted(() => ({
  mockUseTemplatesList: vi.fn(),
  mockUseTemplateProductOptions: vi.fn(),
  mockUseSetTemplateStatus: vi.fn(),
  mockTemplateImportDialog: vi.fn(),
}));

vi.mock("@/features/library/templates/hooks/useTemplates", () => ({
  useTemplatesList: mockUseTemplatesList,
  useTemplateProductOptions: mockUseTemplateProductOptions,
  useSetTemplateStatus: mockUseSetTemplateStatus,
}));

vi.mock("@/features/library/templates/components/TemplateFormDialog", () => ({
  TemplateFormDialog: () => null,
}));

vi.mock("@/features/library/templates/components/TemplateMarkdownImportDialog", () => ({
  TemplateMarkdownImportDialog: (props: Record<string, unknown>) => {
    mockTemplateImportDialog(props);
    return props.open ? <div>import dialog open</div> : null;
  },
}));

import { TemplatesListView } from "@/features/library/templates/components/TemplatesListView";

describe("TemplatesListView import button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTemplatesList.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
    });
    mockUseTemplateProductOptions.mockReturnValue({
      isLoading: false,
      data: [],
    });
    mockUseSetTemplateStatus.mockReturnValue({
      mutateAsync: vi.fn(),
    });
  });

  it("opens markdown import dialog from list view", () => {
    render(
      <MemoryRouter>
        <TemplatesListView organizationId="org-1" userId="user-1" />
      </MemoryRouter>,
    );

    expect(screen.queryByText("import dialog open")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Import Markdown" }));
    expect(screen.getByText("import dialog open")).toBeInTheDocument();
    expect(mockTemplateImportDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        open: true,
      }),
    );
  });
});
