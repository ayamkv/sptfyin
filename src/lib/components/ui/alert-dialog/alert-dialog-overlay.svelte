<script>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { fade, blur } from "svelte/transition";
	import { cn } from "$lib/utils.js";
	let className = undefined;
	export let transition = fade;
	export let transitionConfig = {
		duration: 125,
	};
	export { className as class };
</script>

<AlertDialogPrimitive.Overlay
	{transition}
	{transitionConfig}
	class={cn("fixed inset-0 z-50 bg-background/40 backdrop-blur-md ", className)}
	{...$$restProps}
/>
