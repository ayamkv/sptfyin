<script>
	import { elasticOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import { cn } from "$lib/utils.js";
	import { fly, slide, fade } from 'svelte/transition';
	let className = undefined;
	export { className as class };
</script>

<div class={cn("bg-secondary animate-[pulse_1s_ease-in-out_infinite] rounded-md", className)} {...$$restProps} out:fade="{{duration: 100}}"></div>
