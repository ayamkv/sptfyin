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
			"fixed left-[50%] top-[30%] md:top-[30%] z-50 grid w-full max-w-xs md:max-w-lg translate-x-[-50%]  gap-4 border bg-gradient-to-br from-[#332c4e]/90 via-card/20 via-30% to-card/60 text-card-foreground backdrop-blur-lg p-6 rounded-lg md:w-full highlightCard",
			className
		)}
		{...$$restProps}
	>
		<slot />
	</AlertDialogPrimitive.Content>
</AlertDialog.Portal>
