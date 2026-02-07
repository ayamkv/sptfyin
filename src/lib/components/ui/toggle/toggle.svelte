<script module>
	import { tv } from 'tailwind-variants';

	export const toggleVariants = tv({
		base: 'ring-offset-background hover:text-muted-foreground focus-visible:ring-ring data-[state=on]:text-accent-foreground inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
		variants: {
			variant: {
				default: 'bg-transparent hover:bg-muted data-[state=on]:bg-accent',
				outline: 'border-input hover:bg-accent hover:text-accent-foreground border bg-transparent',
				ghost2:
					'bg-gradient-to-br from-[#38334f] via-30% text-secondary-foreground hover:text-accent-foreground hover:bg-secondary/80 hover:inverseShadow highlightSecondary active:scale-95 transition-all data-[state=on]:from-[#afffdc] data-[state=on]:via-primary data-[state=on]:to-primary data-[state=on]:text-secondary data-[state=on]:highlightGhost border-t'
			},
			size: {
				default: 'h-10 min-w-10 px-3',
				sm: 'h-9 min-w-9 px-2.5',
				lg: 'h-11 min-w-11 px-5'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});
</script>

<script>
	import { Toggle as TogglePrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		pressed = $bindable(false),
		class: className,
		size = 'default',
		variant = 'default',
		...restProps
	} = $props();
</script>

<TogglePrimitive.Root
	bind:ref
	bind:pressed
	class={cn(toggleVariants({ variant, size }), className)}
	{...restProps}
/>
