<script>
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { fade } from 'svelte/transition';
	import { cn } from '$lib/utils.js';
	let {
		class: className = undefined,
		transition = fade,
		transitionConfig = {
			duration: 150
		},
		...rest
	} = $props();
</script>

<DialogPrimitive.Overlay
	{transition}
	{transitionConfig}
	class={cn('fixed inset-0 z-50 bg-background/90', className)}
	{...rest}
/>
