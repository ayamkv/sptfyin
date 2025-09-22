<script>
	import { Select as SelectPrimitive } from 'bits-ui';
	import { scale } from 'svelte/transition';
	import { cn, flyAndScale } from '$lib/utils.js';
	/**
	 * @typedef {Object} Props
	 * @property {number} [sideOffset]
	 * @property {any} [inTransition]
	 * @property {any} [inTransitionConfig]
	 * @property {any} [outTransition]
	 * @property {any} [outTransitionConfig]
	 * @property {any} [class]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let {
		sideOffset = 4,
		inTransition = flyAndScale,
		inTransitionConfig = undefined,
		outTransition = scale,
		outTransitionConfig = {
			start: 0.95,
			opacity: 0,
			duration: 50
		},
		class: className = undefined,
		children,
		...rest
	} = $props();
</script>

<SelectPrimitive.Content
	{inTransition}
	{inTransitionConfig}
	{outTransition}
	{outTransitionConfig}
	{sideOffset}
	class={cn(
		'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover/95 text-popover-foreground shadow-md outline-none',
		className
	)}
	{...rest}
	on:keydown
>
	<div class="w-full">
		{@render children?.()}
	</div>
</SelectPrimitive.Content>
