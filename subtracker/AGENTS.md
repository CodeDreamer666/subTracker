# AGENTS.md

## Instruction Priority

Follow the approved product flow, design, architecture, and implementation plan first.

This file defines default implementation behavior. It must not override explicit decisions in an approved plan.

If the approved plan intentionally uses a pattern discouraged by this file, follow the approved plan.

Do not silently redesign approved architecture. If implementation reveals a real contradiction or blocker, report it and propose the smallest correction instead of inventing a new architecture.

## Development Mode

Development Mode means a real end-to-end implementation with limited hardening, not a prototype.

Use the real implementation path for:

- Authentication
- Authorization
- External APIs
- Database persistence
- tRPC procedures
- Business logic
- Frontend-to-backend integration

Do not replace real functionality with:

- Mock data
- Simulated APIs
- Fake scan results
- Browser-local replacement state
- Placeholder backend behavior

unless the user explicitly requests a prototype or mock.

Development Mode should make the normal expected user flow work correctly with the real services and persistence.

Production-only hardening such as exhaustive edge-case handling, advanced retries, queues, background workers, large-scale concurrency handling, observability infrastructure, and other operational concerns may be deferred unless required for basic correctness or security.

## Philosophy

Simplicity first.

Within the approved product flow and architecture, prefer the smallest, clearest implementation that correctly solves the current requirement.

Avoid:

- Over-engineering
- Speculative abstractions
- Unnecessary dependencies
- Excessive helper functions
- Premature optimization
- Enterprise-style architecture
- Unrelated refactoring
- Clever code when explicit code is easier to understand

Product quality, security, correctness, readability, and maintainability matter more than architectural purity.

Make the smallest coherent implementation that fully satisfies the approved task or plan.

Reuse existing codebase patterns before introducing new ones. When a similar component, query, utility, or structure already exists, extend or follow that pattern instead of inventing a new approach.

When implementation details are not specified by the approved plan, ship the boring, explicit solution.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- tRPC
- Prisma
- PostgreSQL
- Better Auth

Do not replace these technologies with alternatives unless the approved plan explicitly requires it.

## Routing and Page Structure

Use Next.js App Router for application routes.

When the approved user flow or design represents separate application pages or routes, implement them as separate App Router routes and files.

Do not place the entire application inside one page component and switch between unrelated full pages using local conditional state.

Loading states, empty states, dialogs, tabs, and other states that genuinely belong to the same route do not require separate routes.

Do not create extra routes merely to split code.

## Backend Rules

- Use tRPC for application backend queries and mutations.
- Never use Next.js Server Actions.
- Prefer direct Prisma queries inside tRPC procedures for simple operations unless the approved architecture explicitly places the logic elsewhere.
- Validate procedure inputs with Zod at the procedure boundary.
- Keep procedures focused and readable.
- A tRPC procedure calling Prisma directly is the default and is not a code smell.
- Put authentication checks in tRPC middleware or context through protected procedures.
- Do not scatter repeated authentication checks across individual procedures.
- Keep ownership checks close to the database operation when user-owned data is accessed or modified.
- Do not introduce service, repository, controller, or similar architectural layers on your own.

If the approved architecture introduces a separate module because it has a clear current responsibility, follow the approved architecture.

If implementation reveals a genuine need for a new architectural layer that is not in the approved plan, report the need before adding it.

## Async Code

Use `async` / `await` for asynchronous operations.

Never use the `void` operator to start, discard, suppress, or silence a Promise.

Do not write:

```ts
void doSomethingAsync();
```

Do not use `void` as a workaround for an unhandled Promise.

When an asynchronous operation is triggered from an event handler, use an async handler and await the operation:

```ts
async function handleSubmit() {
    await doSomethingAsync();
}
```

When success, failure, loading state, or returned data matters to the user flow, handle it explicitly with `async` / `await`.

Do not intentionally create fire-and-forget Promises.

## React and Frontend Rules

Prefer straightforward React state and component logic.

Use `useState` and `useEffect` when they are the simplest appropriate solution.

Do not introduce `useMemo`, `useCallback`, `useReducer`, custom hooks, context, or global state solely for abstraction, style, or speculative performance.

Use them only when:

- The approved architecture requires them, or
- They solve a clear current problem that cannot be handled more simply.

Do not restructure approved frontend state management without a concrete reason.

Avoid unnecessary component splitting.

Extract a component when:

- It is reused, or
- The existing component has become genuinely difficult to read, or
- It represents a clear visual or behavioral unit from the approved design.

Prefer simple prop passing for nearby components. Introduce shared state mechanisms only when the current component structure genuinely requires them.

## DOM Structure and Wrappers

Do not add wrapper elements without a concrete purpose.

Every wrapper should contribute at least one of the following:

- Layout
- Styling
- Semantics
- Positioning
- Event handling
- Accessibility
- Animation
- Responsive behavior
- A required library/component structure

Prefer styling an existing element or component instead of adding another `<div>`.

Remove wrappers that do not affect behavior, layout, semantics, or styling.

Use semantic HTML such as `main`, `section`, `nav`, `header`, `footer`, and `form` when appropriate.

Do not create deeply nested DOM structures merely to make JSX look organized.

## Tailwind CSS Rules

Use Tailwind CSS as the default styling system.

Use straightforward Tailwind utilities for:

- Spacing
- Flexbox
- Grid
- Sizing
- Typography
- Colors
- Borders
- Responsive design
- Hover, focus, disabled, and other UI states

Do not create custom CSS for styling that can be expressed clearly with normal Tailwind utilities.

Avoid:

- Complicated selectors
- Excessive arbitrary values such as `w-[173px]`
- Positional hacks
- Unnecessarily complex class combinations
- Custom CSS files for ordinary component styling

Use arbitrary values when they are necessary to faithfully implement the approved design and there is no clearer standard utility or reusable token.

Custom CSS is acceptable only when it is materially clearer than the Tailwind equivalent or when Tailwind cannot express the required behavior cleanly.

Keep `className` values readable.

## File and Folder Structure

Follow the approved architecture or implementation plan when one exists.

Otherwise, follow the existing repository structure and conventions.

Keep the structure shallow and easy to navigate.

Do not create new architectural layers, folders, or generic utility collections without a current reason.

Separate real application routes into their own App Router route folders when the user flow and design define them as separate pages.

Do not stack unrelated pages into a single file.

Split files only when doing so meaningfully improves readability, responsibility boundaries, or reuse.

Do not enforce arbitrary file-length limits.

Avoid giant generic helper files that collect unrelated responsibilities.

## Implementation Discipline

Before changing code:

1. Read the approved plan.
2. Inspect the relevant existing files.
3. Identify the smallest coherent set of files that must change.
4. Follow existing project patterns unless the approved plan says otherwise.

During implementation:

- Follow approved route, module, and data-flow boundaries.
- Do not redesign the feature.
- Do not change product behavior unless required by the approved task.
- Do not add speculative production infrastructure during Development Mode.
- Do not perform unrelated cleanup.
- Do not rename unrelated files, variables, or components.
- Do not rewrite working code solely to match a preferred style.
- Do not create abstractions simply to reduce line count.
- Keep important business logic obvious and easy to locate.
- Prefer direct readable code over indirect helper chains.

If a real conflict exists between the user flow, design, approved architecture, and repository, report the conflict instead of silently choosing a new direction.

## Refactoring Rules

When asked to refactor, preserve behavior unless the request explicitly changes behavior.

Refactor only the requested problems.

Do not use a cleanup task as permission to redesign the application.

For implementation-quality cleanup, prioritize:

1. Correct route and page structure.
2. Correct backend boundary using tRPC.
3. Clear `async` / `await` control flow with no `void`.
4. Tailwind CSS instead of unnecessary custom CSS.
5. Removal of unnecessary DOM wrappers.
6. Readability and consistency.

Make one coherent category of change at a time when the refactor is broad enough that combining everything would make verification difficult.

After each meaningful category of changes, run the relevant type, lint, or build checks.

Fix errors caused by the refactor before continuing.

## General Guidelines

- Use judgment instead of rigid architecture rules.
- Exceptions are acceptable when required for correctness, security, library integration, or meaningfully clearer code.
- Do not add dependencies for problems that can be solved with existing code.
- Prefer explicit and readable code over clever abstractions.
- Preserve existing behavior unless the requested change requires modifying it.
- Prefer focused changes.
- Keep diffs limited to the approved task, but do not sacrifice correctness or approved architecture merely to minimize line count.
- Do not hide important behavior behind vague helpers.
- Use specific function and component names that explain their responsibility.

When in doubt, choose the boring solution that is easiest to understand and maintain.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
