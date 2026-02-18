import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateProduct,
  mockUpdateProduct,
  mockArchiveProduct,
  mockUnarchiveProduct,
  mockInvalidateDashboardForOrg,
} = vi.hoisted(() => ({
  mockCreateProduct: vi.fn(),
  mockUpdateProduct: vi.fn(),
  mockArchiveProduct: vi.fn(),
  mockUnarchiveProduct: vi.fn(),
  mockInvalidateDashboardForOrg: vi.fn(),
}));

vi.mock("@/features/library/products/services/productsService", () => ({
  archiveProduct: mockArchiveProduct,
  createProduct: mockCreateProduct,
  getProductById: vi.fn(),
  getProductPerformanceSummary: vi.fn(),
  listProductOptions: vi.fn(),
  listProducts: vi.fn(),
  unarchiveProduct: mockUnarchiveProduct,
  updateProduct: mockUpdateProduct,
}));

vi.mock("@/lib/dashboardInvalidation", () => ({
  invalidateDashboardForOrg: mockInvalidateDashboardForOrg,
}));

import {
  useArchiveProduct,
  useCreateProduct,
  useUnarchiveProduct,
  useUpdateProduct,
} from "@/features/library/products/hooks/useProducts";

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

  return { wrapper };
}

describe("product dashboard invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidateDashboardForOrg.mockResolvedValue(undefined);
  });

  it("invalidates dashboard after creating a product", async () => {
    mockCreateProduct.mockResolvedValue({
      data: { id: "prod-1", organization_id: "org-1" },
      error: null,
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateProduct(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({} as never);
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledWith(expect.anything(), "org-1");
  });

  it("invalidates dashboard after updating a product", async () => {
    mockUpdateProduct.mockResolvedValue({
      data: { id: "prod-1", organization_id: "org-1" },
      error: null,
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateProduct(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({} as never);
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledWith(expect.anything(), "org-1");
  });

  it("invalidates dashboard after archiving and restoring a product", async () => {
    mockArchiveProduct.mockResolvedValue({
      data: { id: "prod-1", organization_id: "org-1" },
      error: null,
    });
    mockUnarchiveProduct.mockResolvedValue({
      data: { id: "prod-1", organization_id: "org-1" },
      error: null,
    });
    const { wrapper } = createWrapper();
    const archive = renderHook(() => useArchiveProduct(), { wrapper });
    const unarchive = renderHook(() => useUnarchiveProduct(), { wrapper });

    await act(async () => {
      await archive.result.current.mutateAsync("prod-1");
      await unarchive.result.current.mutateAsync("prod-1");
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledTimes(2);
    expect(mockInvalidateDashboardForOrg).toHaveBeenNthCalledWith(1, expect.anything(), "org-1");
    expect(mockInvalidateDashboardForOrg).toHaveBeenNthCalledWith(2, expect.anything(), "org-1");
  });
});
