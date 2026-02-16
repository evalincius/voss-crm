export { CampaignsListView } from "./components/CampaignsListView";
export { CampaignFormDialog } from "./components/CampaignFormDialog";
export { CampaignDetailView } from "./components/CampaignDetailView";
export { CampaignMetricsPanel } from "./components/CampaignMetricsPanel";
export { CampaignMemberSearch } from "./components/CampaignMemberSearch";
export { CampaignLeadConversionDialog } from "./components/CampaignLeadConversionDialog";
export { CampaignBulkConversionDialog } from "./components/CampaignBulkConversionDialog";
export {
  useCampaignsList,
  useCampaignDetail,
  useCampaignLinkedProductIds,
  useCampaignLinkedTemplateIds,
  useCampaignMembers,
  useCampaignMetrics,
  usePersonCampaignMemberships,
  useCreateCampaign,
  useUpdateCampaign,
  useArchiveCampaign,
  useUnarchiveCampaign,
  useSyncCampaignProducts,
  useSyncCampaignTemplates,
  useAddPeopleToCampaign,
  useRemovePersonFromCampaign,
  useBulkCampaignDealDuplicatePreview,
  useConvertCampaignLead,
  useBulkConvertCampaignMembersToDeals,
} from "./hooks/useCampaigns";
export {
  campaignFormSchema,
  campaignFiltersSchema,
  campaignLeadConversionSchema,
  campaignBulkConversionSchema,
} from "./schemas/campaigns.schema";
export {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  archiveCampaign,
  unarchiveCampaign,
  getCampaignLinkedProductIds,
  getCampaignLinkedProducts,
  syncCampaignProducts,
  getCampaignLinkedTemplateIds,
  getCampaignLinkedTemplates,
  syncCampaignTemplates,
  listCampaignMembers,
  listCampaignMemberDeals,
  addPeopleToCampaign,
  removePersonFromCampaign,
  getCampaignMetrics,
  searchPeopleForCampaign,
  listCampaignOptions,
  listCampaignTemplateOptions,
  listCampaignProductOptions,
  getPersonCampaignMemberships,
  convertCampaignLead,
  previewBulkCampaignDealDuplicates,
  bulkConvertCampaignMembersToDeals,
} from "./services/campaignsService";
export type {
  Campaign,
  CampaignType,
  CampaignArchiveFilter,
  CampaignSort,
  CampaignListParams,
  CampaignMetrics,
  CampaignMemberSummary,
  CampaignMemberDealSummary,
  PersonCampaignMembership,
  CampaignConversionMode,
  BulkDuplicateStrategy,
  ConvertCampaignLeadInput,
  CampaignLeadConversionResult,
  BulkConvertCampaignMembersToDealsInput,
  BulkConvertCampaignMembersToDealsResult,
  BulkCampaignDealDuplicatePreviewRow,
} from "./types";
