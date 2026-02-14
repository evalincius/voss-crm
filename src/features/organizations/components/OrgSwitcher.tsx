import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateOrgDialog } from "./CreateOrgDialog";

interface OrgSwitcherProps {
  isCollapsed: boolean;
}

export function OrgSwitcher({ isCollapsed }: OrgSwitcherProps) {
  const { organizations, currentOrganization, switchOrganization, loading } = useAuth();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (loading) {
    return <Skeleton className="h-9 w-full" />;
  }

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="bg-sidebar-accent text-text-primary flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold"
            aria-label={currentOrganization?.name ?? "Organization"}
          >
            {currentOrganization?.name?.charAt(0).toUpperCase() ?? "O"}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-56">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => void switchOrganization(org.id)}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              <span className="flex-1 truncate">{org.name}</span>
              {org.id === currentOrganization?.id && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void navigate(ROUTES.ORG_SETTINGS)} className="gap-2">
            <Settings className="h-4 w-4" />
            Organization settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create organization
          </DropdownMenuItem>
        </DropdownMenuContent>
        <CreateOrgDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </DropdownMenu>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "hover:bg-sidebar-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            )}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-left">
              {currentOrganization?.name ?? "Select organization"}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => void switchOrganization(org.id)}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              <span className="flex-1 truncate">{org.name}</span>
              {org.id === currentOrganization?.id && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void navigate(ROUTES.ORG_SETTINGS)} className="gap-2">
            <Settings className="h-4 w-4" />
            Organization settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateOrgDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
}
