<script>
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import { cn } from '$lib/utils.js';
	let { el = $bindable(undefined), class: className = undefined, children, ...rest } = $props();
</script>

<DrawerPrimitive.Overlay bind:el class={cn('fixed inset-0 z-50 bg-black/80', className)} {...rest}>
	{@render children?.()}
</DrawerPrimitive.Overlay>
