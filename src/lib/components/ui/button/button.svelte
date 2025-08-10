<script>
	import { Button as ButtonPrimitive } from "bits-ui";
	import { buttonVariants } from "./index.js";
	import { cn } from "$lib/utils.js";
	/**
	 * @typedef {Object} Props
	 * @property {any} [class]
	 * @property {string} [variant]
	 * @property {string} [size]
	 * @property {any} [builders]
	 * @property {any} [ref]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let {
		class: className = undefined,
		variant = "default",
		size = "default",
		builders = [],
		ref = $bindable(null),
		children,
		...rest
	} = $props();
	
</script>

<ButtonPrimitive.Root
	bind:this={ref}
	{builders}
	class={cn(buttonVariants({ variant, size, className }))}
	type="button"
	{...rest}
	on:click
	on:keydown
>
	{@render children?.()}
</ButtonPrimitive.Root>
