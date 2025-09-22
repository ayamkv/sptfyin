<script>
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, children, ...rest } = $props();
</script>

<div class={cn('flex flex-col space-y-1.5 p-6', className)} {...rest}>
	{@render children?.()}
</div>
