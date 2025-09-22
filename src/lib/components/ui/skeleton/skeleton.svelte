<script>
	import { cn } from '$lib/utils.js';
	import { fade } from 'svelte/transition';
	let { class: className = undefined, ...rest } = $props();
</script>

<div
	class={cn('animate-[pulse_1s_ease-in-out_infinite] rounded-md bg-secondary', className)}
	{...rest}
	out:fade={{ duration: 100 }}
></div>
