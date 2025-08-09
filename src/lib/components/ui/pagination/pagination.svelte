<script>
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	/**
	 * @typedef {Object} Props
	 * @property {any} [class]
	 * @property {number} [count]
	 * @property {number} [perPage]
	 * @property {number} [page]
	 * @property {number} [siblingCount]
	 * @property {import('svelte').Snippet<[any]>} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let {
		class: className = undefined,
		count = 0,
		perPage = 10,
		page = $bindable(1),
		siblingCount = 1,
		children,
		...rest
	} = $props();
	
	let currentPage = $derived(page);

	const children_render = $derived(children);
</script>

<PaginationPrimitive.Root
	{count}
	{perPage}
	{siblingCount}
	bind:page
	
	
	
	asChild
	{...rest}
>
	{#snippet children({ builder, pages, range })}
		<nav {...builder} class={cn("mx-auto flex w-full flex-col items-center", className)}>
			{@render children_render?.({ pages, range, currentPage, })}
		</nav>
	{/snippet}
</PaginationPrimitive.Root>
