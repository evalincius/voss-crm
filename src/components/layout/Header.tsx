import { useLocation } from "react-router";
import { Sun, Moon, User, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { QuickAddMenu } from "@/components/shared/QuickAddMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";

const pageTitleRules: Array<{ title: string; matches: (pathname: string) => boolean }> = [
  { title: "Dashboard", matches: (pathname) => pathname === ROUTES.DASHBOARD },
  {
    title: "People",
    matches: (pathname) => pathname === ROUTES.PEOPLE || pathname.startsWith(`${ROUTES.PEOPLE}/`),
  },
  {
    title: "Campaigns",
    matches: (pathname) =>
      pathname === ROUTES.CAMPAIGNS || pathname.startsWith(`${ROUTES.CAMPAIGNS}/`),
  },
  { title: "Deals", matches: (pathname) => pathname === ROUTES.DEALS },
  {
    title: "Library",
    matches: (pathname) =>
      pathname === ROUTES.LIBRARY ||
      pathname === ROUTES.LIBRARY_PRODUCTS ||
      pathname.startsWith(`${ROUTES.LIBRARY_PRODUCTS}/`) ||
      pathname === ROUTES.LIBRARY_TEMPLATES ||
      pathname.startsWith(`${ROUTES.LIBRARY_TEMPLATES}/`),
  },
  {
    title: "Organization Settings",
    matches: (pathname) => pathname === ROUTES.ORG_SETTINGS,
  },
];

export function Header() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const title = pageTitleRules.find((rule) => rule.matches(location.pathname))?.title ?? "Page";

  return (
    <header
      data-slot="header"
      className="border-border-fintech bg-bg-surface flex h-16 shrink-0 items-center justify-between border-b px-6"
    >
      <h1 className="font-heading text-text-primary text-xl font-bold">{title}</h1>

      <div className="flex items-center gap-3">
        <QuickAddMenu />

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
