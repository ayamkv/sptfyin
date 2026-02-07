<script>
	import { cn } from '$lib/utils.js';
	let { class: className = undefined, ...rest } = $props();
</script>

<div class={cn('my-1 h-px bg-muted', className)} {...rest}></div>
