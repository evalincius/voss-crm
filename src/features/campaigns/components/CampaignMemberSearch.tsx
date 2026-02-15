import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { searchPeopleForCampaign } from "@/features/campaigns/services/campaignsService";
import { useAddPeopleToCampaign } from "@/features/campaigns/hooks/useCampaigns";

interface CampaignMemberSearchProps {
  organizationId: string;
  campaignId: string;
  userId: string;
  existingMemberIds: string[];
}

export function CampaignMemberSearch({
  organizationId,
  campaignId,
  userId,
  existingMemberIds,
}: CampaignMemberSearchProps) {
  const [search, setSearch] = useState("");
  const addMutation = useAddPeopleToCampaign();

  const searchQuery = useQuery({
    queryKey: ["campaigns", "member-search", organizationId, campaignId, search],
    queryFn: async () => {
      const result = await searchPeopleForCampaign(organizationId, search, existingMemberIds);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to search people");
      }
      return result.data;
    },
    enabled: search.trim().length > 0,
  });

  async function onAdd(personId: string) {
    try {
      await addMutation.mutateAsync({
        organizationId,
        campaignId,
        personIds: [personId],
        userId,
      });
      toast.success("Person added to campaign");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add person");
    }
  }

  return (
    <div className="space-y-2">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search people to add..."
        aria-label="Search people to add"
        className="bg-bg-app border-border-fintech h-10 text-base"
      />

      {searchQuery.isLoading ? <p className="text-text-secondary text-sm">Searching...</p> : null}

      {searchQuery.data && searchQuery.data.length > 0 ? (
        <ul className="max-h-48 space-y-1 overflow-auto">
          {searchQuery.data.map((person) => (
            <li
              key={person.id}
              className="border-border-fintech bg-bg-app flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div>
                <p className="text-text-primary text-base">{person.full_name}</p>
                <p className="text-text-secondary text-sm">{person.email ?? "-"}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void onAdd(person.id)}
                disabled={addMutation.isPending}
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {searchQuery.data && searchQuery.data.length === 0 && search.trim().length > 0 ? (
        <p className="text-text-secondary text-sm">No people found.</p>
      ) : null}
    </div>
  );
}
