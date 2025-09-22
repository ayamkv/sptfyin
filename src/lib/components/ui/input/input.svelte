<script>
	import { cn } from '$lib/utils.js';

	let {
		class: className = undefined,
		value = $bindable(undefined),
		readonly = undefined,
		...rest
	} = $props();
</script>

<input
	class={cn(
		'inverseShadow flex h-10 w-full rounded-md border border-input bg-background/20 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	bind:value
	{readonly}
	{...rest}
	{...rest}
/>
