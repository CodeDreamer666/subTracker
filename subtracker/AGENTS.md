## Philosophy

Simplicity first.

Prefer the smallest, clearest solution that correctly solves the current requirement.

Avoid:

* Over-engineering
* Speculative abstractions
* Unnecessary dependencies
* Excessive helper functions
* Premature optimization
* Enterprise-style architecture

Product quality, security, correctness, and maintainability matter more than architectural purity.

Make the smallest possible change needed to satisfy the request. Avoid unrelated refactoring, renaming, or “while I’m here” cleanup.

Reuse existing codebase patterns before introducing new ones. When a similar component, query, utility, or structure already exists, extend or follow that pattern instead of inventing a new approach.

## Stack

* Next.js App Router
* TypeScript
* Tailwind CSS
* tRPC
* Prisma
* PostgreSQL
* Better Auth

## Backend Rules

* Use tRPC for all backend queries and mutations.
* Do not use Next.js Server Actions.
* Prefer direct Prisma queries inside tRPC procedures for simple operations.
* Do not add service, repository, controller, or similar layers unless the project has a real, current need for them.
* Validate inputs with Zod at the procedure boundary.
* Keep procedures small and readable.
* A tRPC procedure calling Prisma directly is the default and is not a code smell.
* Put authentication checks in tRPC middleware or context through protected procedures.
* Do not scatter repeated authentication checks across individual procedures.

Additional layers are acceptable when:

* Logic is reused across multiple procedures.
* The current logic is genuinely complex.
* The separation meaningfully improves clarity.

Do not introduce layers for anticipated future complexity.

## React and Frontend Rules

* Prefer simple React logic.
* Mainly use `useState` and `useEffect`.
* Do not introduce `useMemo`, `useCallback`, `useReducer`, custom hooks, or global state without a clear, current practical need.
* Do not add abstractions for speculative performance concerns.
* Avoid unnecessary component splitting.
* Extract a component only when it is reused or when the existing component has become genuinely difficult to read.
* Avoid excessive prop drilling workarounds.
* Do not introduce context providers for problems that do not currently exist.

## Tailwind CSS Rules

Use straightforward utilities for:

* Spacing
* Flexbox
* Grid
* Sizing
* Typography
* Borders
* Responsive design

Avoid:

* Complicated selectors
* Excessive arbitrary values such as `w-[173px]`
* Positional hacks
* Unnecessarily complex class combinations

Use arbitrary values or positional techniques only when there is no clean alternative.

Keep `className` values readable. Do not fight Tailwind to avoid a small custom CSS class when custom CSS would be clearer.

## File and Folder Structure

Keep the structure shallow, feature-oriented, and easy to navigate.

Use the following as a flexible guideline:

```text
app/
  Routes, layouts, and pages using the App Router

features/
  <feature>/
    Feature-specific components, hooks, and logic

components/
  Shared and reusable UI components

server/
  routers/
    tRPC routers

  trpc.ts
    tRPC initialization, context, and middleware

lib/
  auth/
    Better Auth configuration and helpers

  db/
    Prisma client and database helpers

  utils/
    Small shared utilities, formatting functions, and constants

prisma/
  schema.prisma
  migrations/
```

This structure is not mandatory.

When an existing project already has a clear and functional structure, follow its established patterns instead of forcing it into this layout.

## General Guidelines

* Do not enforce arbitrary file-length limits.
* Split files only when doing so genuinely improves readability.
* Use judgment instead of rigid rules.
* Exceptions are acceptable when required for correctness, security, library integration, or meaningfully clearer code.
* Do not add dependencies for problems that can be solved with a few lines of existing code.
* Prefer explicit and readable code over clever abstractions.
* Avoid unrelated cleanup unless the user explicitly requests it.
* Preserve existing behavior unless the requested change requires modifying it.
* Prefer focused changes with small diffs.
* Do not rewrite working code solely to match a preferred style.

When in doubt, ship the boring solution.