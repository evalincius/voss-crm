import { useLocation } from "react-router";
import { Sun, Moon, User, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";

const pageTitles: Record<string, string> = {
  [ROUTES.DASHBOARD]: "Dashboard",
  [ROUTES.ORG_SETTINGS]: "Organization Settings",
};

export function Header() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const title = pageTitles[location.pathname] ?? "Page";

  return (
    <header
      data-slot="header"
      className="border-border-fintech bg-bg-surface flex h-16 shrink-0 items-center justify-between border-b px-6"
    >
      <h1 className="font-heading text-text-primary text-xl font-bold">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary flex h-9 w-9 items-center justify-center rounded-md transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="bg-bg-surface-hover text-text-secondary hover:text-text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              aria-label="User menu"
            >
              <User className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-text-secondary truncate text-xs">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
