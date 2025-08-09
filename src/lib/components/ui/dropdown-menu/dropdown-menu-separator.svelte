<script>
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, ...rest } = $props();
	
</script>

<DropdownMenuPrimitive.Separator
	class={cn("bg-muted -mx-1 my-1 h-px", className)}
	{...rest}
/>
