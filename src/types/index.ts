import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export type ApiResult<T> = { data: T; error: null } | { data: null; error: string };
