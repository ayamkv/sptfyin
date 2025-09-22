<script>
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, value, children, ...rest } = $props();
</script>

<AccordionPrimitive.Item {value} class={cn('border-b', className)} {...rest}>
	{@render children?.()}
</AccordionPrimitive.Item>
