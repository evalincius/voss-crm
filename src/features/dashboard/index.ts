export type { FollowUpItem, StaleDeal, PipelineStageCount, TopProduct, TopCampaign } from "./types";

export {
  getFollowUpsDue,
  getStaleDeals,
  getPipelineSnapshot,
  getTopProducts,
  getTopCampaigns,
} from "./services/dashboardService";

export {
  useFollowUpsDue,
  useStaleDeals,
  usePipelineSnapshot,
  useTopProducts,
  useTopCampaigns,
} from "./hooks/useDashboard";
