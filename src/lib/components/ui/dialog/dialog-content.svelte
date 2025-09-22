<script>
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import X from 'lucide-svelte/icons/x';
	import * as Dialog from './index.js';
	import { cn, flyAndScale } from '$lib/utils.js';
	let {
		class: className = undefined,
		transition = flyAndScale,
		transitionConfig = {
			duration: 200
		},
		children,
		...rest
	} = $props();
</script>

<Dialog.Portal>
	<Dialog.Overlay />
	<DialogPrimitive.Content
		{transition}
		{transitionConfig}
		class={cn(
			'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg md:w-full',
			className
		)}
		{...rest}
	>
		{@render children?.()}
		<DialogPrimitive.Close
			class="absolute right-4 top-4 rounded-md bg-background ring-offset-background transition-opacity hover:bg-primary hover:text-black focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-background data-[state=open]:text-muted-foreground"
		>
			<X class="h-8 w-8" />
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</Dialog.Portal>
