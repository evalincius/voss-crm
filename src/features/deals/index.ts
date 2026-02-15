export { DealFormDialog } from "./components/DealFormDialog";
export { DealsBoard } from "./components/DealsBoard";
export { DealsFilters } from "./components/DealsFilters";
export { DealColumn } from "./components/DealColumn";
export { DealCard } from "./components/DealCard";
export { DealDrawer } from "./components/DealDrawer";
export {
  useDealsList,
  useDealDetail,
  useDealsByPerson,
  useDealInteractions,
  useCheckDuplicateDeal,
  useCreateDeal,
  useUpdateDeal,
  useUpdateDealStage,
} from "./hooks/useDeals";
export { dealFormSchema } from "./schemas/deals.schema";
export {
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  updateDealStage,
  checkDuplicateDeal,
  listDealsByPerson,
  listInteractionsByDeal,
  searchPeopleForDeal,
} from "./services/dealsService";
export type {
  Deal,
  DealStage,
  DealListParams,
  CreateDealInput,
  UpdateDealInput,
  DealCardData,
  DuplicateDealWarning,
} from "./types";
