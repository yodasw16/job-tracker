# Job Tracker

A responsive job-search tracker built with Next.js, React, TypeScript, CSS Modules, Base UI, and Supabase PostgreSQL with email/password authentication.

## Features

- Opportunity cards, status grouping, application-date sorting, job links, salary, addresses, and saved descriptions.
- Dated interview/contact history and inclusive date-range reporting.
- Upcoming interviews and pending next actions, including overdue items.
- Fictional in-memory examples at `/preview`.

## Local setup

Use Node.js 22 or newer. Install dependencies with `npm install`.

Create a Supabase project and review the migrations in `supabase/migrations/` before applying them in filename order. Never rerun migrations against an existing database blindly. Row-level security restricts records to their owners.

Create an ignored local environment file with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Use only a publishable key; never expose a service-role or secret key. Create your account through Supabase authentication administration and keep public signup disabled for a private instance.

Run `npm run dev` and open http://localhost:3000. Use a consistent hostname for authentication cookies. `/preview` does not save changes or access private records.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

No lint script is currently configured. Database isolation checks are in `supabase/tests/`; review them before running against your own project.

## Hosting

Vercel is the intended hosting platform. Configure the two public Supabase variables in the hosting dashboard and configure Supabase authentication URLs for your deployment. Verify authentication, persistence, and owner isolation before importing personal data.

## Status

The core tracker is implemented and tested locally. Spreadsheet import, account recovery, backup documentation, and production deployment verification remain release work. Interview preparation belongs to the next milestone. See PLAN.md.

Use fictional data in public examples. Never commit credentials, environment files, personal spreadsheets, or interview documents.

## License

MIT.
