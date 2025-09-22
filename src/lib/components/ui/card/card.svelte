<script>
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, children, ...rest } = $props();
</script>

<div
	class={cn(
		'highlightCard rounded-lg bg-gradient-to-br from-[#332c4e]/80 via-card via-30% to-card text-card-foreground',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
