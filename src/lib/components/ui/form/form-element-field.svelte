<script lang="ts" module></script>

<script lang="ts" generics="T extends Record<string, unknown>, U extends FormPathLeaves<T>">
	import * as FormPrimitive from "formsnap";
	import { cn } from "$lib/utils.js";
	let {
		form,
		name,
		class: className = undefined,
		children
	} = $props();
	

	const children_render = $derived(children);
</script>

<FormPrimitive.ElementField {form} {name}    >
	{#snippet children({ constraints, errors, tainted, value })}
		<div class={cn("space-y-2", className)}>
			{@render children_render?.({ constraints, errors, tainted, value, })}
		</div>
	{/snippet}
</FormPrimitive.ElementField>
