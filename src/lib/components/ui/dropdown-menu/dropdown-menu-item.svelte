<script>
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, inset = undefined, children, ...rest } = $props();
	
</script>

<DropdownMenuPrimitive.Item
	class={cn(
		"data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		inset && "pl-8",
		className
	)}
	{...rest}
	on:click
	on:keydown
	on:focusin
	on:focusout
	on:pointerdown
	on:pointerleave
	on:pointermove
>
	{@render children?.()}
</DropdownMenuPrimitive.Item>
