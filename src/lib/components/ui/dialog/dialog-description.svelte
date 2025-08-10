<script>
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, children, ...rest } = $props();
	
</script>

<DialogPrimitive.Description
	class={cn("text-muted-foreground text-sm", className)}
	{...rest}
>
	{@render children?.()}
</DialogPrimitive.Description>
