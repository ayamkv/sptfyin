<script>
	import { cn } from "$lib/utils.js";
	let { el = $bindable(undefined), class: className = undefined, children, ...rest } = $props();
	
</script>

<div bind:this={el} class={cn("mt-auto flex flex-col gap-2 p-4 mb-2 md:mb-4", className)} {...rest}>
	{@render children?.()}
</div>
