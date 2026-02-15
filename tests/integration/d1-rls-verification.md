# D1 RLS Verification Checklist

## Setup

1. `npm run db:reset`
2. Sign in as `test@example.com` and create at least one person.
3. Create a second org for the same user and switch current org.

## Queries

### 1) People reads are current-org scoped

```sql
select id, organization_id, full_name from public.people;
```

Expected: rows from current organization only.

### 2) People writes require organization membership and created_by auth uid

```sql
insert into public.people (organization_id, full_name, created_by)
values ('00000000-0000-0000-0000-000000000000', 'Invalid Org Insert', auth.uid());
```

Expected: denied by RLS.

### 3) Interaction-person cross-org association is blocked

```sql
insert into public.interactions (organization_id, person_id, type, summary, created_by)
values (
  'org-id-a',
  'person-id-from-org-b',
  'note',
  'cross org link',
  auth.uid()
);
```

Expected: rejected by FK `interactions_people_fk`.

### 4) Interaction reads are current-org scoped

```sql
select id, organization_id, person_id, type from public.interactions;
```

Expected: rows from current organization only.
