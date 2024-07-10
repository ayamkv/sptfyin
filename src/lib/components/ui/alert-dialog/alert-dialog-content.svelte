<script>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import * as AlertDialog from "./index.js";
	import { cn, flyAndScale } from "$lib/utils.js";
	export let transition = flyAndScale;
	export let transitionConfig = undefined;
	let className = undefined;
	export { className as class };
</script>

<AlertDialog.Portal>
	<AlertDialog.Overlay />
	<AlertDialogPrimitive.Content
		{transition}
		{transitionConfig}
		class={cn(
			"fixed left-[50%] top-[30%] md:top-[30%] z-50 grid w-full max-w-xs md:max-w-lg translate-x-[-50%]  gap-4 border bg-background p-6 sm:rounded-lg md:w-full highlightCard",
			className
		)}
		{...$$restProps}
	>
		<slot />
	</AlertDialogPrimitive.Content>
</AlertDialog.Portal>
