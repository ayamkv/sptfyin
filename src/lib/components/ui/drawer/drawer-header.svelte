<script>
	import { cn } from "$lib/utils.js";
	export let el = undefined;
	let className = undefined;
	export { className as class };
</script>

<div
	bind:this={el}
	class={cn("grid gap-1.5 p-4 text-center", className)}
	{...$$restProps}
>
	<slot />
</div>
