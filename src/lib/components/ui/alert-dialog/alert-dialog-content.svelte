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
			'highlightCard fixed left-[50%] top-[10%] z-50 grid w-full max-w-xs translate-x-[-50%] gap-4  rounded-lg border bg-gradient-to-br from-[#332c4e]/90 via-card/20 via-30% to-card/60 p-6 text-card-foreground backdrop-blur-lg md:top-[30%] md:w-full md:max-w-lg',
			className
		)}
		{...rest}
	>
		{@render children?.()}
	</AlertDialogPrimitive.Content>
</AlertDialog.Portal>
