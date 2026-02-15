import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { campaignKeys } from "@/lib/queryKeys";

interface AddToCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  userId: string;
  personIds: string[];
  onSuccess?: () => void;
}

export function AddToCampaignDialog({
  open,
  onOpenChange,
  organizationId,
  userId,
  personIds,
  onSuccess,
}: AddToCampaignDialogProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const queryClient = useQueryClient();

  const campaignOptionsQuery = useQuery({
    queryKey: ["campaigns", "options-for-add", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("is_archived", false)
        .order("name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map((row) => ({
        id: (row as { id: string }).id,
        name: (row as { name: string }).name,
      }));
    },
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCampaignId) {
        throw new Error("Please select a campaign");
      }

      // Idempotent add: check existing, insert only new
      const { data: existing, error: existingError } = await supabase
        .from("campaign_people")
        .select("person_id")
        .eq("organization_id", organizationId)
        .eq("campaign_id", selectedCampaignId)
        .in("person_id", personIds);

      if (existingError) {
        throw new Error(existingError.message);
      }

      const existingIds = new Set(
        (existing ?? []).map((row) => (row as { person_id: string }).person_id),
      );
      const toInsert = personIds.filter((id) => !existingIds.has(id));

      if (toInsert.length === 0) {
        return { added: 0 };
      }

      const insertPayload = toInsert.map((personId) => ({
        organization_id: organizationId,
        campaign_id: selectedCampaignId,
        person_id: personId,
        created_by: userId,
      }));

      const { error } = await supabase.from("campaign_people").insert(insertPayload);

      if (error) {
        throw new Error(error.message);
      }

      return { added: toInsert.length };
    },
    onSuccess: async (result) => {
      toast.success(
        `${result.added} ${result.added === 1 ? "person" : "people"} added to campaign`,
      );

      // Invalidate campaign members + metrics
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.members(organizationId, selectedCampaignId).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.metrics(organizationId, selectedCampaignId).queryKey,
      });

      onOpenChange(false);
      setSelectedCampaignId("");
      onSuccess?.();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to campaign</DialogTitle>
          <DialogDescription>
            Add {personIds.length} selected {personIds.length === 1 ? "person" : "people"} to a
            campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign</Label>
            {campaignOptionsQuery.isLoading ? (
              <p className="text-text-secondary text-sm">Loading campaigns...</p>
            ) : null}
            {campaignOptionsQuery.data && campaignOptionsQuery.data.length > 0 ? (
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaignOptionsQuery.data.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : !campaignOptionsQuery.isLoading ? (
              <p className="text-text-secondary text-sm">
                No active campaigns available. Create a campaign first.
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={!selectedCampaignId || addMutation.isPending}
            onClick={() => void addMutation.mutateAsync()}
          >
            {addMutation.isPending ? "Adding..." : "Add to campaign"}
          </Button>

          {addMutation.isError ? (
            <p className="text-destructive text-sm">
              {addMutation.error instanceof Error
                ? addMutation.error.message
                : "Failed to add people"}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
