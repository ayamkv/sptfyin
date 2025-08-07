<script>
	import { cn } from "$lib/utils.js";
	let className = undefined;
	export { className as class };
</script>

<div
	class={cn("rounded-lg bg-gradient-to-br from-[#332c4e]/80 via-card via-30% to-card text-card-foreground highlightCard", className)}
	{...$$restProps}
>
	<slot />
</div>


