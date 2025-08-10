<script>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	/**
	 * @typedef {Object} Props
	 * @property {any} [class]
	 * @property {string} [level]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { class: className = undefined, level = "h3", children, ...rest } = $props();
	
</script>

<AlertDialogPrimitive.Title class={cn("text-2xl font-semibold", className)} {level} {...rest}>
	{@render children?.()}
</AlertDialogPrimitive.Title>
