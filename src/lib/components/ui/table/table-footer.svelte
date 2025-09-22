<script>
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, children, ...rest } = $props();
</script>

<tfoot class={cn('bg-primary font-medium text-primary-foreground', className)} {...rest}>
	{@render children?.()}
</tfoot>
