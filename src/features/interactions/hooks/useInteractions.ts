import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  createInteraction,
  deleteInteraction,
  getInteractionDealContext,
  listInteractionAssociationOptions,
  listInteractionsByPerson,
  listInteractionTemplateOptionsByProduct,
} from "@/features/interactions/services/interactionsService";
import type { CreateInteractionInput, InteractionOrderBy } from "@/features/interactions/types";
import { invalidateDashboardForOrg } from "@/lib/dashboardInvalidation";
import { dealKeys, interactionKeys, peopleKeys } from "@/lib/queryKeys";

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
      if (interaction.deal_id) {
        await queryClient.invalidateQueries({
          queryKey: dealKeys.interactions(interaction.organization_id, interaction.deal_id)
            .queryKey,
        });
      }
      await invalidateDashboardForOrg(queryClient, interaction.organization_id);
    },
  });
}

export function useInteractionDealContext(organizationId: string | null, dealId: string | null) {
  return useQuery({
    queryKey:
      organizationId && dealId
        ? interactionKeys.dealContext(organizationId, dealId).queryKey
        : (["interactions", "deal-context", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !dealId) {
        throw new Error("Organization and deal are required");
      }

      const result = await getInteractionDealContext(organizationId, dealId);
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!organizationId && !!dealId,
  });
}

export function useInteractionAssociationOptions(
  organizationId: string | null,
  personId: string | null,
) {
  return useQuery({
    queryKey:
      organizationId && personId
        ? interactionKeys.associationOptions(organizationId, personId).queryKey
        : (["interactions", "association-options", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !personId) {
        throw new Error("Organization and person are required");
      }

      const result = await listInteractionAssociationOptions(organizationId, personId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load interaction options");
      }

      return result.data;
    },
    enabled: !!organizationId && !!personId,
  });
}

export function useInteractionTemplateOptionsByProduct(
  organizationId: string | null,
  productId: string | null,
) {
  return useQuery({
    queryKey:
      organizationId && productId
        ? interactionKeys.templateOptionsByProduct(organizationId, productId).queryKey
        : (["interactions", "template-options-by-product", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !productId) {
        throw new Error("Organization and product are required");
      }

      const result = await listInteractionTemplateOptionsByProduct(organizationId, productId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load templates");
      }

      return result.data;
    },
    enabled: !!organizationId && !!productId,
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
