# AGENTS.md - Coding Agent Guidelines

## Build/Test Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint and Prettier checks
- `pnpm format` - Format code with Prettier
- Test command: Use `vitest` for testing (see src/lib/**tests**)

## Tech Stack

SvelteKit + Svelte 5 (runes), PocketBase, Tailwind CSS, Shadcn-Svelte components

## Code Style

- Use tabs for indentation, single quotes, no trailing commas (see .prettierrc)
- **Svelte 5 only**: Use `$state()`, `$derived()`, `$props()` runes - NO `let`/`export let`
- Import shadcn components from `$lib/components/ui/`
- Use PocketBase functions from `$lib/pocketbase.js`
- Iconify icons: `<iconify-icon icon="lucide:icon-name">`
- File naming: kebab-case for components, +page.svelte for routes

## Error Handling

- Use try/catch blocks for async operations
- Display errors via AlertDialog with title/description/icon pattern
- Toast notifications for success states using svelte-sonner

## Key Patterns

- Reactive state: `let variable = $state(initialValue)`
- Computed values: `let computed = $derived(expression)`
- Props: `const { propName } = $props()`
- Form submissions: `onsubmit={preventDefault(handleSubmit)}`
- Protected routes array validation for custom slugs


Note: dont forget to use Context7 if not sure.