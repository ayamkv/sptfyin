<script>
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, children, ...rest } = $props();
</script>

<span class={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)} {...rest}>
	{@render children?.()}
</span>
