<script>
	import * as FormPrimitive from 'formsnap';
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, children, ...rest } = $props();

	const children_render = $derived(children);
</script>

<FormPrimitive.Description class={cn('text-sm text-muted-foreground', className)} {...rest}>
	{#snippet children({ descriptionAttrs })}
		{@render children_render?.({ descriptionAttrs })}
	{/snippet}
</FormPrimitive.Description>
