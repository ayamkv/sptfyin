<script>
	import { Dialog as DialogPrimitive } from "bits-ui";
	import X from "lucide-svelte/icons/x";
	import * as Dialog from "./index.js";
	import { cn, flyAndScale } from "$lib/utils.js";
	let className = undefined;
	export let transition = flyAndScale;
	export let transitionConfig = {
		duration: 200,
	};
	export { className as class };
</script>

<Dialog.Portal>
	<Dialog.Overlay />
	<DialogPrimitive.Content
		{transition}
		{transitionConfig}
		class={cn(
			"bg-background fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg sm:rounded-lg md:w-full",
			className
		)}
		{...$$restProps}
	>
		<slot />
		<DialogPrimitive.Close
			class="ring-offset-background focus:ring-ring data-[state=open]:bg-background data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-md transition-opacity hover:bg-primary hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none bg-background"
		>
			<X class="h-8 w-8" />
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</Dialog.Portal>
