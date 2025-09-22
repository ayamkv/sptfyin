<script>
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { cn } from '$lib/utils.js';
	/**
	 * @typedef {Object} Props
	 * @property {any} [class]
	 * @property {number} [level]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { class: className = undefined, level = 3, children, ...rest } = $props();
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		class={cn(
			'flex flex-1 items-center justify-between py-4 text-left font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
			className
		)}
		{...rest}
		on:click
	>
		{@render children?.()}
		<ChevronDown class="h-4 w-4 transition-transform duration-200" />
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
