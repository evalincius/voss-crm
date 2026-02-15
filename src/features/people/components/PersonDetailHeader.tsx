import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Person } from "@/features/people/types";
import { ROUTES } from "@/lib/constants";

interface PersonDetailHeaderProps {
  person: Person;
  onAddInteraction: () => void;
}

export function PersonDetailHeader({ person, onAddInteraction }: PersonDetailHeaderProps) {
  return (
    <section className="card-surface bg-bg-surface space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-text-primary text-2xl font-semibold">
            {person.full_name}
          </h3>
          <p className="text-text-secondary text-base">
            {person.email ?? "No email"} · {person.phone ?? "No phone"}
          </p>
        </div>
        <Badge variant="secondary">{person.lifecycle}</Badge>
      </div>

      {person.notes ? (
        <p className="text-text-secondary text-base whitespace-pre-wrap">{person.notes}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onAddInteraction}>
          Add Interaction
        </Button>
        <Button asChild variant="secondary">
          <Link
            to={ROUTES.DEALS}
            state={{
              quickAdd: {
                intent: "deal",
                organization_id: person.organization_id,
              },
              personPrefill: {
                id: person.id,
                full_name: person.full_name,
              },
            }}
          >
            Create Deal
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link
            to={ROUTES.CAMPAIGNS}
            state={{
              quickAdd: {
                intent: "campaign",
                organization_id: person.organization_id,
              },
              personPrefill: {
                id: person.id,
                full_name: person.full_name,
              },
            }}
          >
            Add to Campaign
          </Link>
        </Button>
      </div>
    </section>
  );
}
