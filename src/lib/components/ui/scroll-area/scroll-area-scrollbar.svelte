<script>
	import { ScrollArea as ScrollAreaPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	/**
	 * @typedef {Object} Props
	 * @property {any} [class]
	 * @property {string} [orientation]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { class: className = undefined, orientation = "vertical", children } = $props();
	
</script>

<ScrollAreaPrimitive.Scrollbar
	{orientation}
	class={cn(
		"flex touch-none select-none transition-colors",
		orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-px",
		orientation === "horizontal" && "h-2.5 w-full border-t border-t-transparent p-px",
		className
	)}
>
	{@render children?.()}
	<ScrollAreaPrimitive.Thumb
		class={cn("bg-border relative rounded-full", orientation === "vertical" && "flex-1")}
	/>
</ScrollAreaPrimitive.Scrollbar>
