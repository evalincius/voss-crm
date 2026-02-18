export { InteractionFormDialog } from "./components/InteractionFormDialog";
export { InteractionsTimeline } from "./components/InteractionsTimeline";
export {
  usePersonInteractions,
  useCreateInteraction,
  useInteractionDealContext,
  useInteractionAssociationOptions,
  useInteractionTemplateOptionsByProduct,
  useDeleteInteraction,
} from "./hooks/useInteractions";
export { interactionFormSchema, interactionTypeSchema } from "./schemas/interactions.schema";
export {
  createInteraction,
  listInteractionsByPerson,
  getInteractionDealContext,
  listInteractionAssociationOptions,
  listInteractionDealsByPerson,
  listInteractionCampaignOptions,
  listInteractionProductOptions,
  listInteractionTemplateOptions,
  listInteractionTemplateOptionsByProduct,
  deleteInteraction,
} from "./services/interactionsService";
export type {
  Interaction,
  InteractionType,
  CreateInteractionInput,
  InteractionAssociationOptions,
  InteractionDealOption,
  InteractionCampaignOption,
  InteractionProductOption,
  InteractionTemplateOption,
  InteractionDealContext,
} from "./types";
