<script>
	import { cn } from "$lib/utils.js";
	import { fly, slide } from 'svelte/transition';
	let className = undefined;
	export { className as class };
</script>

<div class={cn("bg-secondary animate-[pulse_1s_ease-in-out_infinite] rounded-md", className)} {...$$restProps} out:slide="{{duration: 100}}"></div>
