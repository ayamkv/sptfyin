<script>
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, children, ...rest } = $props();
	
</script>

<div class={cn("flex items-center p-6 pt-0", className)} {...rest}>
	{@render children?.()}
</div>
