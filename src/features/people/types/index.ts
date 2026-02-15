import type { Enums, Tables } from "@/lib/database.types";

export type Person = Tables<"people">;
export type PersonLifecycle = Enums<"person_lifecycle">;

export type PeopleSort = "updated_desc" | "created_desc" | "name_asc";
export type PeopleArchiveFilter = "active" | "all" | "archived";

export interface PeopleListParams {
  organizationId: string;
  search: string;
  lifecycle: PersonLifecycle | "all";
  archiveFilter: PeopleArchiveFilter;
  sort: PeopleSort;
  page: number;
  pageSize: number;
  productInterest: string | null;
  sourceCampaign: string | null;
  hasOpenDeal: boolean | null;
}

export interface PaginatedPeopleResult {
  items: Person[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreatePersonInput {
  organization_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  lifecycle?: PersonLifecycle;
  created_by: string;
}

export interface UpdatePersonInput {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  lifecycle: PersonLifecycle;
}
