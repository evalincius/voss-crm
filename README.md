## Quickstart

1. Install dependencies:

```bash
npm install
```

2. Start local Supabase:

```bash
npm run db:start
```

3. Get the public client key for local development:

- Run `supabase status` and copy the `Publishable key` or Legacy `anon key` value (use this as `VITE_SUPABASE_PUBLISHABLE_KEY` locally).
- If `npm run db:start` printed credentials `Publishable key` in your terminal, you can copy the same key from there.

4. Create your local env file from the example:

```bash
cp .env.example .env
```

5. Open `.env` and set:

- `VITE_SUPABASE_URL` (default local value from `.env.example` is `http://127.0.0.1:54341`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (paste the local anon/public key from step 2)

6. Start the React app:

```bash
npm run dev
```

7. To stop supabase local Containers:

```bash
supabase stop
```

8. To apply supabase migrations in local:

```bash
 supabase migration up
```

## How to Use PRD to Deliverable Prompts

1. How to use implement-deliverable prompt

```bash
/prd-to-deliverables.md /docs/001-scafolding/PRD.md
```

2. How to use implement-deliverable prompt
   > Switch to PLAN MODE Shift + Tab

```bash
/implement-deliverable implement D0 from  '/docs/001-scafolding/BACKLOG.md'
```
