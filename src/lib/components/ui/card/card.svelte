<script>
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, children, ...rest } = $props();
</script>

<div
	class={cn(
		'highlightCard rounded-lg bg-card text-card-foreground',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
