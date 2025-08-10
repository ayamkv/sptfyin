<script>
	import { Avatar as AvatarPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, delayMs = undefined, children, ...rest } = $props();
	
</script>

<AvatarPrimitive.Root
	{delayMs}
	class={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
	{...rest}
>
	{@render children?.()}
</AvatarPrimitive.Root>
