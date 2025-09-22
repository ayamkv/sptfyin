<script>
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, ...rest } = $props();
</script>

<SelectPrimitive.Separator class={cn('my-1 h-px bg-muted', className)} {...rest} />
