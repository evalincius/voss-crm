import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type QueryKey,
} from "@tanstack/react-query";
import {
  archivePerson,
  createPerson,
  getPersonById,
  listPeople,
  unarchivePerson,
  updatePerson,
} from "@/features/people/services/peopleService";
import type {
  CreatePersonInput,
  PeopleListParams,
  UpdatePersonInput,
} from "@/features/people/types";
import { peopleKeys } from "@/lib/queryKeys";

async function invalidatePeopleListForOrg(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
) {
  await queryClient.invalidateQueries({
    queryKey: peopleKeys.list._def,
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes(`organization_id:${organizationId}`),
  });
}

export function usePeopleList(params: PeopleListParams | null) {
  return useQuery({
    queryKey: params
      ? peopleKeys.list(params.organizationId, {
          search: params.search,
          lifecycle: params.lifecycle,
          archiveFilter: params.archiveFilter,
          sort: params.sort,
          page: params.page,
          pageSize: params.pageSize,
        }).queryKey
      : ["people", "disabled"],
    queryFn: async () => {
      if (!params) {
        throw new Error("People query params are required");
      }

      const result = await listPeople(params);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load people");
      }

      return result.data;
    },
    enabled: !!params,
    placeholderData: keepPreviousData,
  });
}

export function usePersonDetail(organizationId: string | null, personId: string | null) {
  return useQuery({
    queryKey:
      organizationId && personId
        ? peopleKeys.detail(organizationId, personId).queryKey
        : (["people", "detail", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !personId) {
        throw new Error("Organization and person are required");
      }

      const result = await getPersonById(organizationId, personId);
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!organizationId && !!personId,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePersonInput) => {
      const result = await createPerson(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to create person");
      }

      return result.data;
    },
    onSuccess: async (person) => {
      await invalidatePeopleListForOrg(queryClient, person.organization_id);
      await queryClient.invalidateQueries({
        queryKey: peopleKeys.detail(person.organization_id, person.id).queryKey,
      });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePersonInput) => {
      const result = await updatePerson(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to update person");
      }

      return result.data;
    },
    onSuccess: async (person) => {
      await invalidatePeopleListForOrg(queryClient, person.organization_id);
      await queryClient.invalidateQueries({
        queryKey: peopleKeys.detail(person.organization_id, person.id).queryKey,
      });
    },
  });
}

export function useArchivePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (personId: string) => {
      const result = await archivePerson(personId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to archive person");
      }

      return result.data;
    },
    onSuccess: async (person) => {
      await invalidatePeopleListForOrg(queryClient, person.organization_id);
      await queryClient.invalidateQueries({
        queryKey: peopleKeys.detail(person.organization_id, person.id).queryKey,
      });
    },
  });
}

export function useUnarchivePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (personId: string) => {
      const result = await unarchivePerson(personId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to restore person");
      }

      return result.data;
    },
    onSuccess: async (person) => {
      await invalidatePeopleListForOrg(queryClient, person.organization_id);
      await queryClient.invalidateQueries({
        queryKey: peopleKeys.detail(person.organization_id, person.id).queryKey,
      });
    },
  });
}
