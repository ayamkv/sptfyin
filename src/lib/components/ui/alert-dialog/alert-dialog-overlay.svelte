<script>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { fade, blur } from "svelte/transition";
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, transition = fade, transitionConfig = {
		duration: 125,
	}, ...rest } = $props();
	
</script>

<AlertDialogPrimitive.Overlay
	{transition}
	{transitionConfig}
	class={cn("fixed inset-0 z-50 bg-background/80 sm:bg-background/56 backdrop-blur-sm ", className)}
	{...rest}
/>
