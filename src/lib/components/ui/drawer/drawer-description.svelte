<script>
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { cn } from "$lib/utils.js";
	let { el = $bindable(undefined), class: className = undefined, children, ...rest } = $props();
	
</script>

<DrawerPrimitive.Description
	bind:el
	class={cn("text-sm text-muted-foreground", className)}
	{...rest}
>
	{@render children?.()}
</DrawerPrimitive.Description>
