import { useCampaignMetrics } from "@/features/campaigns/hooks/useCampaigns";

interface CampaignMetricsPanelProps {
  organizationId: string;
  campaignId: string;
}

export function CampaignMetricsPanel({ organizationId, campaignId }: CampaignMetricsPanelProps) {
  const metricsQuery = useCampaignMetrics(organizationId, campaignId);

  if (metricsQuery.isLoading) {
    return <p className="text-text-secondary text-base">Loading metrics...</p>;
  }

  if (metricsQuery.isError) {
    return (
      <p className="text-destructive text-base">
        {metricsQuery.error instanceof Error
          ? metricsQuery.error.message
          : "Failed to load metrics"}
      </p>
    );
  }

  const metrics = metricsQuery.data;

  if (!metrics) {
    return null;
  }

  const cards = [
    { label: "People added", value: metrics.peopleAdded },
    { label: "People engaged", value: metrics.peopleEngaged },
    { label: "Deals created", value: metrics.dealsCreated },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="border-border-fintech bg-bg-app rounded-md border px-3 py-2"
        >
          <p className="text-text-secondary text-sm">{card.label}</p>
          <p className="text-text-primary text-xl font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
