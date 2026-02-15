export { TemplatesListView } from "./components/TemplatesListView";
export { TemplateFormDialog } from "./components/TemplateFormDialog";
export { TemplateDetailView } from "./components/TemplateDetailView";
export {
  useTemplatesList,
  useTemplateProductOptions,
  useTemplateDetail,
  useTemplateLinkedProductIds,
  useTemplateUsedInSummary,
  useCreateTemplate,
  useUpdateTemplate,
  useSetTemplateStatus,
  useSyncTemplateProducts,
} from "./hooks/useTemplates";
export { templateFormSchema, templateFiltersSchema } from "./schemas/templates.schema";
export {
  listTemplates,
  listTemplateProductOptions,
  getTemplateById,
  createTemplate,
  updateTemplate,
  setTemplateStatus,
  getTemplateLinkedProductIds,
  syncTemplateProducts,
  getTemplateUsedInSummary,
} from "./services/templatesService";
export type {
  Template,
  TemplateCategory,
  TemplateStatus,
  TemplateStatusFilter,
  TemplateSort,
  TemplateListParams,
  TemplateUsedInSummary,
} from "./types";
