import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import {
  QUICK_ADD_INTENTS,
  ROUTES,
  type QuickAddIntent,
  type QuickAddNavigationState,
} from "@/lib/constants";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuickAddOption {
  label: string;
  intent: QuickAddIntent;
  to: string;
}

const quickAddOptions: QuickAddOption[] = [
  { label: "Person", intent: QUICK_ADD_INTENTS.PERSON, to: ROUTES.PEOPLE },
  { label: "Interaction", intent: QUICK_ADD_INTENTS.INTERACTION, to: ROUTES.PEOPLE },
  { label: "Deal", intent: QUICK_ADD_INTENTS.DEAL, to: ROUTES.DEALS },
  { label: "Campaign", intent: QUICK_ADD_INTENTS.CAMPAIGN, to: ROUTES.CAMPAIGNS },
  { label: "Template", intent: QUICK_ADD_INTENTS.TEMPLATE, to: ROUTES.LIBRARY_TEMPLATES },
];

export function QuickAddMenu() {
  const navigate = useNavigate();
  const { currentOrganization } = useAuth();
  const organizationId = currentOrganization?.id;

  const handleSelect = (option: QuickAddOption) => {
    if (!organizationId) {
      return;
    }

    const state: QuickAddNavigationState = {
      quickAdd: {
        intent: option.intent,
        organization_id: organizationId,
      },
    };

    void navigate(option.to, { state });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="gap-2"
          disabled={!organizationId}
          aria-label="Quick Add"
        >
          <Plus className="h-4 w-4" />
          Quick Add
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {quickAddOptions.map((option) => (
          <DropdownMenuItem
            key={option.intent}
            onSelect={() => handleSelect(option)}
            disabled={!organizationId}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
