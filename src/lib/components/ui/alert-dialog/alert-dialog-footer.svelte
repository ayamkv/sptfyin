<script>
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, children, ...rest } = $props();
	
</script>

<div
	class={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
	{...rest}
>
	{@render children?.()}
</div>
