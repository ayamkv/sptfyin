<script>
	import { Select as SelectPrimitive } from 'bits-ui';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, children, ...rest } = $props();
</script>

<SelectPrimitive.Trigger
	class={cn(
		'highlightSecondary flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-destructive [&>span]:line-clamp-1 data-[placeholder]:[&>span]:text-muted-foreground',
		className
	)}
	{...rest}
>
	{#snippet child({ props })}
		<button {...props}>
			{@render children?.()}
			<ChevronDown class="h-4 w-4" />
		</button>
	{/snippet}
</SelectPrimitive.Trigger>
