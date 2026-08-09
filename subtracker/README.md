# subTracker

subTracker helps people find recurring subscriptions in Gmail, review what is renewing, and track cancellation decisions.

## Local development

1. Add the required environment values listed in `src/env.ts` to `.env`.
2. Start PostgreSQL and run `npm run db:push`.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`.

## Quality checks

Run `npm run check` for ESLint, TypeScript, and formatting. Run `npm run build` before deployment.

## Architecture

The app uses Next.js App Router, TypeScript, Tailwind CSS, tRPC, Prisma/PostgreSQL, and Better Auth. Gmail access is read-only. Email bodies and headers are processed in memory and are not persisted; only normalized subscription candidates are stored.
