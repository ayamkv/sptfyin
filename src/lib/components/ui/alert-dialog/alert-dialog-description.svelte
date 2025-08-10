<script>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, children, ...rest } = $props();
	
</script>

<AlertDialogPrimitive.Description
	class={cn("text-sm text-muted-foreground", className)}
	{...rest}
>
	{@render children?.()}
</AlertDialogPrimitive.Description>
