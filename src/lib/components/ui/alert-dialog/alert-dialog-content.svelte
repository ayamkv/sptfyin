<script>
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import * as AlertDialog from './index.js';
	import { cn, flyAndScale } from '$lib/utils.js';
	let {
		transition = flyAndScale,
		transitionConfig = undefined,
		class: className = undefined,
		children,
		...rest
	} = $props();
</script>

<AlertDialog.Portal>
	<AlertDialog.Overlay />
	<AlertDialogPrimitive.Content
		{transition}
		{transitionConfig}
		class={cn(
			'highlightCard fixed left-[50%] top-[10%] z-50 grid w-full max-w-xs translate-x-[-50%] gap-4  rounded-lg border bg-card/95 p-6 text-card-foreground md:top-[30%] md:w-full md:max-w-lg',
			className
		)}
		{...rest}
	>
		{@render children?.()}
	</AlertDialogPrimitive.Content>
</AlertDialog.Portal>
