<script>
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, children, ...rest } = $props();
	
</script>

<span class={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...rest}>
	{@render children?.()}
</span>
