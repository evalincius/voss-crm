export { InteractionFormDialog } from "./components/InteractionFormDialog";
export { InteractionsTimeline } from "./components/InteractionsTimeline";
export {
  usePersonInteractions,
  useCreateInteraction,
  useDeleteInteraction,
} from "./hooks/useInteractions";
export { interactionFormSchema, interactionTypeSchema } from "./schemas/interactions.schema";
export {
  createInteraction,
  listInteractionsByPerson,
  deleteInteraction,
} from "./services/interactionsService";
export type { Interaction, InteractionType, CreateInteractionInput } from "./types";
