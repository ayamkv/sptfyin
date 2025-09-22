<script>
	import { getFormControl } from 'formsnap';
	import { cn } from '$lib/utils.js';
	import { Label } from '$lib/components/ui/label/index.js';
	let { class: className = undefined, children, ...rest } = $props();

	const { labelAttrs } = getFormControl();
</script>

<Label {...$labelAttrs} class={cn('data-[fs-error]:text-destructive', className)} {...rest}>
	{@render children?.({ labelAttrs })}
</Label>
