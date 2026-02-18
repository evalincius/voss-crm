import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Archive, Undo2, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DEAL_STAGE_LABELS, ROUTES } from "@/lib/constants";
import {
  useArchiveCampaign,
  useCampaignDetail,
  useCampaignMembers,
  useRemovePersonFromCampaign,
  useUnarchiveCampaign,
} from "@/features/campaigns/hooks/useCampaigns";
import {
  getCampaignLinkedProducts,
  getCampaignLinkedTemplates,
  listCampaignMemberDeals,
} from "@/features/campaigns/services/campaignsService";
import type { CampaignMemberDealSummary } from "@/features/campaigns/types";
import { CampaignFormDialog } from "@/features/campaigns/components/CampaignFormDialog";
import { CampaignMetricsPanel } from "@/features/campaigns/components/CampaignMetricsPanel";
import { CampaignMemberSearch } from "@/features/campaigns/components/CampaignMemberSearch";
import { CampaignLeadConversionDialog } from "@/features/campaigns/components/CampaignLeadConversionDialog";
import { CampaignBulkConversionDialog } from "@/features/campaigns/components/CampaignBulkConversionDialog";
import { useQuery } from "@tanstack/react-query";
import { campaignKeys } from "@/lib/queryKeys";

interface CampaignDetailViewProps {
  organizationId: string;
  userId: string;
  campaignId: string;
}

const MEMBER_ACTION_BUTTON_STYLES = {
  convert: "bg-primary text-black hover:bg-primary-hover hover:text-black",
  deal: "border border-primary/35 bg-primary/15 text-text-primary hover:bg-primary/22 hover:text-text-primary",
} as const;

export function CampaignDetailView({
  organizationId,
  userId,
  campaignId,
}: CampaignDetailViewProps) {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false);
  const [isBulkConversionOpen, setIsBulkConversionOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [selectedMemberDeal, setSelectedMemberDeal] = useState<CampaignMemberDealSummary | null>(
    null,
  );
  const [selectedMemberForConversion, setSelectedMemberForConversion] = useState<{
    id: string;
    full_name: string;
    email: string | null;
  } | null>(null);
  const detailQuery = useCampaignDetail(organizationId, campaignId);
  const membersQuery = useCampaignMembers(organizationId, campaignId);
  const archiveMutation = useArchiveCampaign();
  const unarchiveMutation = useUnarchiveCampaign();
  const removeMemberMutation = useRemovePersonFromCampaign();

  const linkedProductsQuery = useQuery({
    queryKey: [...campaignKeys.productLinks(organizationId, campaignId).queryKey, "summaries"],
    queryFn: async () => {
      const result = await getCampaignLinkedProducts(organizationId, campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load linked products");
      }
      return result.data;
    },
  });

  const linkedTemplatesQuery = useQuery({
    queryKey: [...campaignKeys.templateLinks(organizationId, campaignId).queryKey, "summaries"],
    queryFn: async () => {
      const result = await getCampaignLinkedTemplates(organizationId, campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load linked templates");
      }
      return result.data;
    },
  });

  const memberDealsQuery = useQuery({
    queryKey: [...campaignKeys.members(organizationId, campaignId).queryKey, "deals"],
    queryFn: async () => {
      const result = await listCampaignMemberDeals(organizationId, campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load campaign deals");
      }
      return result.data;
    },
  });

  async function onArchiveToggle() {
    if (!detailQuery.data) {
      return;
    }

    try {
      if (detailQuery.data.is_archived) {
        await unarchiveMutation.mutateAsync(detailQuery.data.id);
        toast.success("Campaign restored");
      } else {
        await archiveMutation.mutateAsync(detailQuery.data.id);
        toast.success("Campaign archived");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update campaign");
    }
  }

  async function onRemoveMember(personId: string) {
    try {
      await removeMemberMutation.mutateAsync({
        organizationId,
        campaignId,
        personId,
      });
      toast.success("Member removed");
      setSelectedMemberIds((prev) => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  }

  useEffect(() => {
    const memberIds = new Set((membersQuery.data ?? []).map((member) => member.person_id));
    setSelectedMemberIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => memberIds.has(id)));
      return next;
    });
  }, [membersQuery.data]);

  useEffect(() => {
    if (!selectedMemberDeal) {
      return;
    }

    const dealStillExists = (memberDealsQuery.data ?? []).some(
      (deal) => deal.id === selectedMemberDeal.id,
    );
    if (!dealStillExists) {
      setSelectedMemberDeal(null);
    }
  }, [memberDealsQuery.data, selectedMemberDeal]);

  function toggleMemberSelection(personId: string, checked: boolean) {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(personId);
      } else {
        next.delete(personId);
      }
      return next;
    });
  }

  function toggleAllMembers(checked: boolean) {
    const ids = (membersQuery.data ?? []).map((member) => member.person_id);
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }

  const existingMemberIds = (membersQuery.data ?? []).map((m) => m.person_id);
  const selectedMembers = useMemo(
    () =>
      (membersQuery.data ?? [])
        .filter((member) => selectedMemberIds.has(member.person_id))
        .map((member) => ({
          id: member.person_id,
          full_name: member.full_name,
          email: member.email,
        })),
    [membersQuery.data, selectedMemberIds],
  );
  const latestDealByPersonId = useMemo(() => {
    const map = new Map<string, CampaignMemberDealSummary>();

    for (const deal of memberDealsQuery.data ?? []) {
      if (!map.has(deal.person_id)) {
        map.set(deal.person_id, deal);
      }
    }

    return map;
  }, [memberDealsQuery.data]);
  const singleLinkedProductId = useMemo(() => {
    const activeLinkedProducts = (linkedProductsQuery.data ?? []).filter(
      (product) => !product.is_archived,
    );
    const firstLinkedProduct = activeLinkedProducts[0];

    return activeLinkedProducts.length === 1 && firstLinkedProduct ? firstLinkedProduct.id : null;
  }, [linkedProductsQuery.data]);
  const allMembersSelected =
    (membersQuery.data ?? []).length > 0 &&
    (membersQuery.data ?? []).every((member) => selectedMemberIds.has(member.person_id));
  const selectedDealValue = useMemo(() => {
    if (!selectedMemberDeal || selectedMemberDeal.value === null) {
      return "-";
    }

    const currency = selectedMemberDeal.currency?.trim();
    if (currency) {
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }).format(selectedMemberDeal.value);
      } catch {
        return `${selectedMemberDeal.value.toLocaleString()} ${currency}`;
      }
    }

    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(selectedMemberDeal.value);
  }, [selectedMemberDeal]);

  return (
    <section className="space-y-4">
      <Button type="button" variant="secondary" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h2 className="font-heading text-text-primary text-2xl font-bold">Campaign Detail</h2>

      {detailQuery.isLoading ? (
        <p className="text-text-secondary text-base">Loading campaign...</p>
      ) : null}
      {detailQuery.isError ? (
        <p className="text-destructive text-base">
          {detailQuery.error instanceof Error
            ? detailQuery.error.message
            : "Failed to load campaign"}
        </p>
      ) : null}

      {!detailQuery.isLoading && !detailQuery.isError && !detailQuery.data ? (
        <p className="text-text-secondary text-base">Campaign not found.</p>
      ) : null}

      {detailQuery.data ? (
        <>
          <div className="card-surface bg-bg-surface space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-heading text-text-primary text-xl font-bold">
                  {detailQuery.data.name}
                </p>
                <p className="text-text-secondary text-base">
                  Type: {detailQuery.data.type.replace(/_/g, " ")}
                </p>
                <p className="text-text-secondary mt-1 text-sm">
                  Status: {detailQuery.data.is_archived ? "archived" : "active"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsEditOpen(true)}>
                  Edit
                </Button>
                <Button type="button" variant="secondary" onClick={() => void onArchiveToggle()}>
                  {detailQuery.data.is_archived ? (
                    <>
                      <Undo2 className="h-4 w-4" />
                      Restore
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      Archive
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="card-surface bg-bg-surface space-y-3 p-4">
            <h3 className="font-heading text-text-primary text-lg font-bold">Metrics</h3>
            <CampaignMetricsPanel organizationId={organizationId} campaignId={campaignId} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card-surface bg-bg-surface space-y-3 p-4">
              <h3 className="font-heading text-text-primary text-lg font-bold">Linked products</h3>
              {linkedProductsQuery.isLoading ? (
                <p className="text-text-secondary text-base">Loading...</p>
              ) : null}
              {linkedProductsQuery.data?.length ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-border-fintech border-b">
                      <th className="text-text-secondary pb-2 font-medium">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedProductsQuery.data.map((product) => (
                      <tr key={product.id} className="border-border-fintech border-b last:border-0">
                        <td className="py-2.5">
                          <Link
                            className="text-primary hover:underline"
                            to={`${ROUTES.LIBRARY_PRODUCTS}/${product.id}`}
                          >
                            {product.name}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : !linkedProductsQuery.isLoading ? (
                <p className="text-text-secondary text-base">No products linked.</p>
              ) : null}
            </div>

            <div className="card-surface bg-bg-surface space-y-3 p-4">
              <h3 className="font-heading text-text-primary text-lg font-bold">Linked templates</h3>
              {linkedTemplatesQuery.isLoading ? (
                <p className="text-text-secondary text-base">Loading...</p>
              ) : null}
              {linkedTemplatesQuery.data?.length ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-border-fintech border-b">
                      <th className="text-text-secondary pb-2 font-medium">Name</th>
                      <th className="text-text-secondary pb-2 font-medium">Category</th>
                      <th className="text-text-secondary pb-2 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedTemplatesQuery.data.map((template) => (
                      <tr
                        key={template.id}
                        className="border-border-fintech border-b last:border-0"
                      >
                        <td className="py-2.5">
                          <Link
                            className="text-primary hover:underline"
                            to={`${ROUTES.LIBRARY_TEMPLATES}/${template.id}`}
                          >
                            {template.title}
                          </Link>
                        </td>
                        <td className="text-text-secondary py-2.5 capitalize">
                          {template.category.replace(/_/g, " ")}
                        </td>
                        <td className="text-text-secondary py-2.5 text-right capitalize">
                          {template.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : !linkedTemplatesQuery.isLoading ? (
                <p className="text-text-secondary text-base">No templates linked.</p>
              ) : null}
            </div>
          </div>

          <div className="card-surface bg-bg-surface space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-heading text-text-primary text-lg font-bold">Members</h3>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsNewLeadDialogOpen(true)}
              >
                New lead conversion
              </Button>
            </div>

            <CampaignMemberSearch
              organizationId={organizationId}
              campaignId={campaignId}
              userId={userId}
              existingMemberIds={existingMemberIds}
            />

            {membersQuery.isLoading ? (
              <p className="text-text-secondary text-base">Loading members...</p>
            ) : null}
            {membersQuery.isError ? (
              <p className="text-destructive text-base">
                {membersQuery.error instanceof Error
                  ? membersQuery.error.message
                  : "Failed to load members"}
              </p>
            ) : null}
            {memberDealsQuery.isError ? (
              <p className="text-destructive text-sm">
                {memberDealsQuery.error instanceof Error
                  ? memberDealsQuery.error.message
                  : "Failed to load linked deals"}
              </p>
            ) : null}

            {!membersQuery.isLoading && !membersQuery.isError ? (
              <>
                {selectedMemberIds.size > 0 ? (
                  <div className="border-border-fintech bg-bg-app flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <p className="text-text-primary text-base">{selectedMemberIds.size} selected</p>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={() => setIsBulkConversionOpen(true)}>
                        Convert selected
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedMemberIds(new Set())}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : null}

                {(membersQuery.data ?? []).length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-border-fintech border-b">
                        <th className="text-text-secondary pb-2 font-medium">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={allMembersSelected}
                              onChange={(event) => toggleAllMembers(event.target.checked)}
                              aria-label="Select all members"
                            />
                            <span>Name</span>
                          </div>
                        </th>
                        <th className="text-text-secondary pb-2 font-medium">Email</th>
                        <th className="text-text-secondary pb-2 font-medium">Lifecycle</th>
                        <th className="text-text-secondary pb-2 text-right font-medium">Added</th>
                        <th className="pb-2 text-right">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersQuery.data?.map((member) => {
                        const memberDeal = latestDealByPersonId.get(member.person_id);

                        return (
                          <tr
                            key={member.id}
                            className="border-border-fintech border-b last:border-0"
                          >
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedMemberIds.has(member.person_id)}
                                  onChange={(event) =>
                                    toggleMemberSelection(member.person_id, event.target.checked)
                                  }
                                  aria-label={`Select ${member.full_name}`}
                                />
                                <Link
                                  className="text-primary hover:underline"
                                  to={`${ROUTES.PEOPLE}/${member.person_id}`}
                                >
                                  {member.full_name}
                                </Link>
                              </div>
                            </td>
                            <td className="text-text-secondary py-2.5">{member.email ?? "-"}</td>
                            <td className="text-text-secondary py-2.5 capitalize">
                              {member.lifecycle}
                            </td>
                            <td className="text-text-secondary py-2.5 text-right tabular-nums">
                              {new Date(member.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 text-right">
                              <div className="flex justify-end gap-1">
                                {memberDeal ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className={MEMBER_ACTION_BUTTON_STYLES.deal}
                                    onClick={() => setSelectedMemberDeal(memberDeal)}
                                  >
                                    Deal
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="default"
                                    className={MEMBER_ACTION_BUTTON_STYLES.convert}
                                    onClick={() =>
                                      setSelectedMemberForConversion({
                                        id: member.person_id,
                                        full_name: member.full_name,
                                        email: member.email,
                                      })
                                    }
                                  >
                                    Convert
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="text-text-secondary hover:text-destructive h-7 w-7"
                                  onClick={() => void onRemoveMember(member.person_id)}
                                  aria-label={`Remove ${member.full_name}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-text-secondary text-base">No members yet.</p>
                )}
              </>
            ) : null}
          </div>

          <Sheet
            open={!!selectedMemberDeal}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                setSelectedMemberDeal(null);
              }
            }}
          >
            <SheetContent side="right" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  {selectedMemberDeal ? (
                    <Link
                      className="text-primary hover:underline"
                      to={`${ROUTES.PEOPLE}/${selectedMemberDeal.person_id}`}
                    >
                      {selectedMemberDeal.person_name}
                    </Link>
                  ) : (
                    "Deal"
                  )}
                </SheetTitle>
                <SheetDescription>
                  {selectedMemberDeal ? "Preview of deal details." : null}
                </SheetDescription>
              </SheetHeader>

              {selectedMemberDeal ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedMemberDeal.product_name}</Badge>
                    <Badge variant="outline">{DEAL_STAGE_LABELS[selectedMemberDeal.stage]}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-border-fintech bg-bg-app rounded-md border px-3 py-2">
                      <p className="text-text-secondary text-xs uppercase">Value</p>
                      <p className="text-text-primary text-base font-medium">{selectedDealValue}</p>
                    </div>
                    <div className="border-border-fintech bg-bg-app rounded-md border px-3 py-2">
                      <p className="text-text-secondary text-xs uppercase">Currency</p>
                      <p className="text-text-primary text-base font-medium">
                        {selectedMemberDeal.currency ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="border-border-fintech bg-bg-app rounded-md border px-3 py-2">
                    <p className="text-text-secondary text-xs uppercase">Next step</p>
                    <p className="text-text-primary text-base font-medium">
                      {selectedMemberDeal.next_step_at
                        ? new Date(selectedMemberDeal.next_step_at).toLocaleString()
                        : "-"}
                    </p>
                  </div>

                  <div className="border-border-fintech bg-bg-app rounded-md border px-3 py-2">
                    <p className="text-text-secondary text-xs uppercase">Notes</p>
                    <p className="text-text-primary text-base whitespace-pre-wrap">
                      {selectedMemberDeal.notes ?? "-"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-border-fintech bg-bg-app rounded-md border px-3 py-2">
                      <p className="text-text-secondary text-xs uppercase">Created</p>
                      <p className="text-text-primary text-sm tabular-nums">
                        {new Date(selectedMemberDeal.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="border-border-fintech bg-bg-app rounded-md border px-3 py-2">
                      <p className="text-text-secondary text-xs uppercase">Updated</p>
                      <p className="text-text-primary text-sm tabular-nums">
                        {new Date(selectedMemberDeal.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Button asChild type="button" variant="outline" className="w-full">
                    <Link to={ROUTES.DEALS}>Open deals board</Link>
                  </Button>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>

          <CampaignFormDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            organizationId={organizationId}
            userId={userId}
            campaign={detailQuery.data}
          />

          <CampaignLeadConversionDialog
            open={isNewLeadDialogOpen}
            onOpenChange={setIsNewLeadDialogOpen}
            organizationId={organizationId}
            defaultProductId={singleLinkedProductId}
            campaign={{
              id: detailQuery.data.id,
              name: detailQuery.data.name,
              type: detailQuery.data.type,
            }}
          />

          <CampaignLeadConversionDialog
            open={!!selectedMemberForConversion}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                setSelectedMemberForConversion(null);
              }
            }}
            organizationId={organizationId}
            defaultProductId={singleLinkedProductId}
            campaign={{
              id: detailQuery.data.id,
              name: detailQuery.data.name,
              type: detailQuery.data.type,
            }}
            memberPrefill={selectedMemberForConversion}
          />

          <CampaignBulkConversionDialog
            open={isBulkConversionOpen}
            onOpenChange={setIsBulkConversionOpen}
            organizationId={organizationId}
            campaign={{ id: detailQuery.data.id, name: detailQuery.data.name }}
            members={selectedMembers}
            onSuccess={() => setSelectedMemberIds(new Set())}
          />
        </>
      ) : null}
    </section>
  );
}
