<script>
	import { cn } from '$lib/utils.js';
	let { el = $bindable(undefined), class: className = undefined, children, ...rest } = $props();
</script>

<div bind:this={el} class={cn('grid gap-1.5 p-4 text-center', className)} {...rest}>
	{@render children?.()}
</div>
