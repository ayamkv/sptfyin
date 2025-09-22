<script>
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, children, ...rest } = $props();
</script>

<td class={cn('px-4 py-2 align-middle [&:has([role=checkbox])]:pr-0', className)} {...rest}>
	{@render children?.()}
</td>
