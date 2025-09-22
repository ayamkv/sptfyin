<script>
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils.js';
	let {
		class: className = undefined,
		transition = slide,
		transitionConfig = {
			duration: 200
		},
		children,
		...rest
	} = $props();
</script>

<AccordionPrimitive.Content
	class={cn('overflow-hidden text-sm transition-all', className)}
	{transition}
	{transitionConfig}
	{...rest}
>
	<div class="px-2 pb-0 pt-0">
		{@render children?.()}
	</div>
</AccordionPrimitive.Content>
