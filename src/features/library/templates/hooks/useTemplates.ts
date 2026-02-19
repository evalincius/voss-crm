import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  commitTemplateMarkdownImport,
  createTemplate,
  getTemplateById,
  getTemplateLinkedProductIds,
  getTemplateUsedInSummary,
  listTemplateProductOptions,
  listTemplates,
  previewTemplateMarkdownImport,
  setTemplateStatus,
  syncTemplateProducts,
  updateTemplate,
} from "@/features/library/templates/services/templatesService";
import type {
  CommitTemplateMarkdownImportInput,
  CreateTemplateInput,
  PreviewTemplateMarkdownImportInput,
  SyncTemplateProductsInput,
  TemplateListParams,
  TemplateStatus,
  UpdateTemplateInput,
} from "@/features/library/templates/types";
import { templateKeys } from "@/lib/queryKeys";

async function invalidateTemplatesForOrg(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
) {
  await queryClient.invalidateQueries({
    queryKey: templateKeys.list._def,
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes(`organization_id:${organizationId}`),
  });

  await queryClient.invalidateQueries({
    queryKey: templateKeys.productOptions._def,
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes(`organization_id:${organizationId}`),
  });

  await queryClient.invalidateQueries({
    queryKey: templateKeys.detail._def,
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes(`organization_id:${organizationId}`),
  });

  await queryClient.invalidateQueries({
    queryKey: templateKeys.productLinks._def,
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes(`organization_id:${organizationId}`),
  });
}

export function useTemplatesList(params: TemplateListParams | null) {
  return useQuery({
    queryKey: params
      ? templateKeys.list(params.organizationId, {
          search: params.search,
          statusFilter: params.statusFilter,
          sort: params.sort,
          productId: params.productId,
        }).queryKey
      : (["templates", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!params) {
        throw new Error("Template query params are required");
      }

      const result = await listTemplates(params);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load templates");
      }

      return result.data;
    },
    enabled: !!params,
  });
}

export function useTemplateProductOptions(organizationId: string | null) {
  return useQuery({
    queryKey: organizationId
      ? templateKeys.productOptions(organizationId).queryKey
      : (["templates", "product-options", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization is required");
      }

      const result = await listTemplateProductOptions(organizationId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load product options");
      }

      return result.data;
    },
    enabled: !!organizationId,
  });
}

export function useTemplateDetail(organizationId: string | null, templateId: string | null) {
  return useQuery({
    queryKey:
      organizationId && templateId
        ? templateKeys.detail(organizationId, templateId).queryKey
        : (["templates", "detail", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !templateId) {
        throw new Error("Organization and template are required");
      }

      const result = await getTemplateById(organizationId, templateId);
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!organizationId && !!templateId,
  });
}

export function useTemplateLinkedProductIds(
  organizationId: string | null,
  templateId: string | null,
) {
  return useQuery({
    queryKey:
      organizationId && templateId
        ? templateKeys.productLinks(organizationId, templateId).queryKey
        : (["templates", "product-links", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !templateId) {
        throw new Error("Organization and template are required");
      }

      const result = await getTemplateLinkedProductIds(organizationId, templateId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load linked products");
      }

      return result.data;
    },
    enabled: !!organizationId && !!templateId,
  });
}

export function useTemplateUsedInSummary(organizationId: string | null, templateId: string | null) {
  return useQuery({
    queryKey:
      organizationId && templateId
        ? templateKeys.usedIn(organizationId, templateId).queryKey
        : (["templates", "used-in", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !templateId) {
        throw new Error("Organization and template are required");
      }

      const result = await getTemplateUsedInSummary(organizationId, templateId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load usage summary");
      }

      return result.data;
    },
    enabled: !!organizationId && !!templateId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const result = await createTemplate(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to create template");
      }

      return result.data;
    },
    onSuccess: async (template) => {
      await invalidateTemplatesForOrg(queryClient, template.organization_id);
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTemplateInput) => {
      const result = await updateTemplate(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to update template");
      }

      return result.data;
    },
    onSuccess: async (template) => {
      await invalidateTemplatesForOrg(queryClient, template.organization_id);
      await queryClient.invalidateQueries({
        queryKey: templateKeys.detail(template.organization_id, template.id).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: templateKeys.usedIn(template.organization_id, template.id).queryKey,
      });
    },
  });
}

export function useSetTemplateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { templateId: string; status: TemplateStatus }) => {
      const result = await setTemplateStatus(input.templateId, input.status);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to update template status");
      }

      return result.data;
    },
    onSuccess: async (template) => {
      await invalidateTemplatesForOrg(queryClient, template.organization_id);
      await queryClient.invalidateQueries({
        queryKey: templateKeys.detail(template.organization_id, template.id).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: templateKeys.usedIn(template.organization_id, template.id).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: templateKeys.productLinks(template.organization_id, template.id).queryKey,
      });
    },
  });
}

export function useSyncTemplateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SyncTemplateProductsInput) => {
      const result = await syncTemplateProducts(input);
      if (result.error) {
        throw new Error(result.error);
      }

      return input;
    },
    onSuccess: async (input) => {
      await queryClient.invalidateQueries({
        queryKey: templateKeys.productLinks(input.organizationId, input.templateId).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: templateKeys.detail(input.organizationId, input.templateId).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: templateKeys.list._def,
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey.includes(`organization_id:${input.organizationId}`),
      });
    },
  });
}

export function usePreviewTemplateMarkdownImport() {
  return useMutation({
    mutationFn: async (input: PreviewTemplateMarkdownImportInput) => {
      const result = await previewTemplateMarkdownImport(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to preview markdown import");
      }

      return result.data;
    },
  });
}

export function useCommitTemplateMarkdownImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CommitTemplateMarkdownImportInput) => {
      const result = await commitTemplateMarkdownImport(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to commit markdown import");
      }

      return { input, result: result.data };
    },
    onSuccess: async ({ input, result }) => {
      if (!result.applied) {
        return;
      }

      await invalidateTemplatesForOrg(queryClient, input.organizationId);
    },
  });
}
