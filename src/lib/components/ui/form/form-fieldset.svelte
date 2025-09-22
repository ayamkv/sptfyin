<script lang="ts" module></script>

<script lang="ts" generics="T extends Record<string, unknown>, U extends FormPath<T>">
	import * as FormPrimitive from 'formsnap';
	import { cn } from '$lib/utils.js';
	let { form, name, class: className = undefined, children } = $props();

	const children_render = $derived(children);
</script>

<FormPrimitive.Fieldset {form} {name} class={cn('space-y-2', className)}>
	{#snippet children({ constraints, errors, tainted, value })}
		{@render children_render?.({ constraints, errors, tainted, value })}
	{/snippet}
</FormPrimitive.Fieldset>
