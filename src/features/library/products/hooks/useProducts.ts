import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  archiveProduct,
  createProduct,
  getProductById,
  getProductPerformanceSummary,
  listProductOptions,
  listProducts,
  unarchiveProduct,
  updateProduct,
} from "@/features/library/products/services/productsService";
import type {
  CreateProductInput,
  ProductListParams,
  UpdateProductInput,
} from "@/features/library/products/types";
import { invalidateDashboardForOrg } from "@/lib/dashboardInvalidation";
import { productKeys } from "@/lib/queryKeys";

async function invalidateProductsForOrg(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
) {
  await queryClient.invalidateQueries({
    queryKey: productKeys.list._def,
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes(`organization_id:${organizationId}`),
  });

  await queryClient.invalidateQueries({
    queryKey: productKeys.options._def,
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes(`organization_id:${organizationId}`),
  });
}

export function useProductsList(params: ProductListParams | null) {
  return useQuery({
    queryKey: params
      ? productKeys.list(params.organizationId, {
          search: params.search,
          archiveFilter: params.archiveFilter,
          sort: params.sort,
        }).queryKey
      : (["products", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!params) {
        throw new Error("Product query params are required");
      }

      const result = await listProducts(params);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load products");
      }

      return result.data;
    },
    enabled: !!params,
  });
}

export function useProductOptions(organizationId: string | null) {
  return useQuery({
    queryKey: organizationId
      ? productKeys.options(organizationId).queryKey
      : (["products", "options", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization is required");
      }

      const result = await listProductOptions(organizationId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load products");
      }

      return result.data;
    },
    enabled: !!organizationId,
  });
}

export function useProductDetail(organizationId: string | null, productId: string | null) {
  return useQuery({
    queryKey:
      organizationId && productId
        ? productKeys.detail(organizationId, productId).queryKey
        : (["products", "detail", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !productId) {
        throw new Error("Organization and product are required");
      }

      const result = await getProductById(organizationId, productId);
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!organizationId && !!productId,
  });
}

export function useProductPerformanceSummary(
  organizationId: string | null,
  productId: string | null,
) {
  return useQuery({
    queryKey:
      organizationId && productId
        ? productKeys.performance(organizationId, productId).queryKey
        : (["products", "performance", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !productId) {
        throw new Error("Organization and product are required");
      }

      const result = await getProductPerformanceSummary(organizationId, productId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load product performance");
      }

      return result.data;
    },
    enabled: !!organizationId && !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const result = await createProduct(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to create product");
      }

      return result.data;
    },
    onSuccess: async (product) => {
      await invalidateProductsForOrg(queryClient, product.organization_id);
      await invalidateDashboardForOrg(queryClient, product.organization_id);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      const result = await updateProduct(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to update product");
      }

      return result.data;
    },
    onSuccess: async (product) => {
      await invalidateProductsForOrg(queryClient, product.organization_id);
      await invalidateDashboardForOrg(queryClient, product.organization_id);
      await queryClient.invalidateQueries({
        queryKey: productKeys.detail(product.organization_id, product.id).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: productKeys.performance(product.organization_id, product.id).queryKey,
      });
    },
  });
}

export function useArchiveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await archiveProduct(productId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to archive product");
      }

      return result.data;
    },
    onSuccess: async (product) => {
      await invalidateProductsForOrg(queryClient, product.organization_id);
      await invalidateDashboardForOrg(queryClient, product.organization_id);
      await queryClient.invalidateQueries({
        queryKey: productKeys.detail(product.organization_id, product.id).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: productKeys.performance(product.organization_id, product.id).queryKey,
      });
    },
  });
}

export function useUnarchiveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await unarchiveProduct(productId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to restore product");
      }

      return result.data;
    },
    onSuccess: async (product) => {
      await invalidateProductsForOrg(queryClient, product.organization_id);
      await invalidateDashboardForOrg(queryClient, product.organization_id);
      await queryClient.invalidateQueries({
        queryKey: productKeys.detail(product.organization_id, product.id).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: productKeys.performance(product.organization_id, product.id).queryKey,
      });
    },
  });
}
