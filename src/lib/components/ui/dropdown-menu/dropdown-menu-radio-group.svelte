<script>
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	let { value = $bindable(undefined), children, ...rest } = $props();
</script>

<DropdownMenuPrimitive.RadioGroup {...rest} bind:value>
	{@render children?.()}
</DropdownMenuPrimitive.RadioGroup>
