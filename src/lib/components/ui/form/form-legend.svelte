<script>
	import * as FormPrimitive from 'formsnap';
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, children, ...rest } = $props();

	const children_render = $derived(children);
</script>

<FormPrimitive.Legend
	{...rest}
	class={cn('text-sm font-medium leading-none data-[fs-error]:text-destructive', className)}
>
	{#snippet children({ legendAttrs })}
		{@render children_render?.({ legendAttrs })}
	{/snippet}
</FormPrimitive.Legend>
