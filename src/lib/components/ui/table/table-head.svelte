<script>
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, children, ...rest } = $props();
	
</script>

<th
	class={cn(
		"h-12 px-4 text-left align-middle font-medium text-foreground [&:has([role=checkbox])]:pr-0",
		className
	)}
	{...rest}
>
	{@render children?.()}
</th>
