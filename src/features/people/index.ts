export { PeopleListView } from "./components/PeopleListView";
export { PersonFormDialog } from "./components/PersonFormDialog";
export { PeopleCsvImportDialog } from "./components/PeopleCsvImportDialog";
export { PersonDetailHeader } from "./components/PersonDetailHeader";
export { PersonRelatedPanels } from "./components/PersonRelatedPanels";
export { PeopleFilters } from "./components/PeopleFilters";
export {
  usePeopleList,
  usePersonDetail,
  useCreatePerson,
  useUpdatePerson,
  useArchivePerson,
  useUnarchivePerson,
} from "./hooks/usePeople";
export { personFormSchema, peopleFiltersSchema } from "./schemas/people.schema";
export { parseCsvText, runPeopleCsvImport } from "./services/peopleCsvImportService";
export {
  listPeople,
  getPersonById,
  createPerson,
  updatePerson,
  archivePerson,
  unarchivePerson,
} from "./services/peopleService";
export type {
  Person,
  PersonLifecycle,
  PeopleListParams,
  PaginatedPeopleResult,
  PeopleArchiveFilter,
  PeopleSort,
} from "./types";
