<script>
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, children, ...rest } = $props();
</script>

<thead class={cn('[&_tr]:border-b', className)} {...rest}>
	{@render children?.()}
</thead>
