import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  createInteraction,
  deleteInteraction,
  listInteractionsByPerson,
} from "@/features/interactions/services/interactionsService";
import type { CreateInteractionInput, InteractionOrderBy } from "@/features/interactions/types";
import { invalidateDashboardForOrg } from "@/lib/dashboardInvalidation";
import { interactionKeys, peopleKeys } from "@/lib/queryKeys";

export function usePersonInteractions(
  organizationId: string | null,
  personId: string | null,
  orderBy: InteractionOrderBy,
) {
  return useQuery({
    queryKey:
      organizationId && personId
        ? [...interactionKeys.byPerson(organizationId, personId).queryKey, `order_by:${orderBy}`]
        : (["interactions", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !personId) {
        throw new Error("Organization and person are required");
      }

      const result = await listInteractionsByPerson(organizationId, personId, orderBy);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load interactions");
      }

      return result.data;
    },
    enabled: !!organizationId && !!personId,
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInteractionInput) => {
      const result = await createInteraction(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to create interaction");
      }

      return result.data;
    },
    onSuccess: async (interaction) => {
      await queryClient.invalidateQueries({
        queryKey: interactionKeys.byPerson(interaction.organization_id, interaction.person_id)
          .queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: peopleKeys.detail(interaction.organization_id, interaction.person_id).queryKey,
      });
      await invalidateDashboardForOrg(queryClient, interaction.organization_id);
    },
  });
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      interactionId: string;
      organizationId: string;
      personId: string;
    }) => {
      const result = await deleteInteraction(
        input.interactionId,
        input.organizationId,
        input.personId,
      );
      if (result.error) {
        throw new Error(result.error);
      }

      return input;
    },
    onSuccess: async (input) => {
      await queryClient.invalidateQueries({
        queryKey: interactionKeys.byPerson(input.organizationId, input.personId).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: peopleKeys.detail(input.organizationId, input.personId).queryKey,
      });
      await invalidateDashboardForOrg(queryClient, input.organizationId);
    },
  });
}
