<script>
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, children, ...rest } = $props();
	
</script>

<li class={cn("", className)} {...rest}>
	{@render children?.()}
</li>
