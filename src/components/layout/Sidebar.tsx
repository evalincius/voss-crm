import { useLocation, Link } from "react-router";
import { LayoutDashboard, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, APP_NAME, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "@/lib/constants";
import type { NavItem } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OrgSwitcher } from "@/features/organizations/components";

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      data-slot="sidebar"
      style={{
        width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
      }}
      className="border-sidebar-border bg-sidebar-background flex h-screen flex-col border-r transition-[width] duration-200 ease-out"
    >
      {/* Logo */}
      <div className="border-sidebar-border flex h-16 items-center gap-2 border-b px-4">
        <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold">
          CE
        </div>
        {!isCollapsed && (
          <span className="font-heading text-text-primary text-lg font-bold">{APP_NAME}</span>
        )}
      </div>

      {/* OrgSwitcher */}
      <div className="border-sidebar-border border-b px-3 py-2">
        <OrgSwitcher isCollapsed={isCollapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          const linkContent = (
            <Link
              to={item.href}
              data-active={isActive}
              className={cn(
                "nav-indicator flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-0",
              )}
            >
              <Icon
                className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-[#7B8198]")}
              />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.href}>{linkContent}</div>;
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-sidebar-border border-t p-2">
        <button
          onClick={onToggleCollapse}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center justify-center rounded-md p-2 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-5 w-5" />
          ) : (
            <ChevronsLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
