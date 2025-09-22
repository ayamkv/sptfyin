<script>
	import { cn } from '$lib/utils.js';
	let { el = $bindable(undefined), class: className = undefined, children, ...rest } = $props();
</script>

<div bind:this={el} class={cn('mb-2 mt-auto flex flex-col gap-2 p-4 md:mb-4', className)} {...rest}>
	{@render children?.()}
</div>
