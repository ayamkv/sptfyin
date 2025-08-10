<script>
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { cn } from "$lib/utils.js";
	let { el = $bindable(undefined), class: className = undefined, children, ...rest } = $props();
	
</script>

<DrawerPrimitive.Title
	bind:el
	class={cn("text-lg md:text-xl font-semibold leading-none tracking-tight", className)}
	{...rest}
>
	{@render children?.()}
</DrawerPrimitive.Title>
