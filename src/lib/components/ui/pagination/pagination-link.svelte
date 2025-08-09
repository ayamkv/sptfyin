<script>
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	/**
	 * @typedef {Object} Props
	 * @property {any} [class]
	 * @property {any} page
	 * @property {string} [size]
	 * @property {boolean} [isActive]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let {
		class: className = undefined,
		page = $bindable(),
		size = "icon",
		isActive = false,
		children,
		...rest
	} = $props();
	
</script>

<PaginationPrimitive.Page
	bind:page
	class={cn(
		buttonVariants({
			variant: isActive ? "outline" : "ghost",
			size,
		}),
		className
	)}
	{...rest}
	on:click
>
	{#if children}{@render children()}{:else}{page.value}{/if}
</PaginationPrimitive.Page>
