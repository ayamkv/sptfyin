<script>
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, children, ...rest } = $props();
	
</script>

<DialogPrimitive.Title
	class={cn("text-lg font-semibold leading-none tracking-tight", className)}
	{...rest}
>
	{@render children?.()}
</DialogPrimitive.Title>
