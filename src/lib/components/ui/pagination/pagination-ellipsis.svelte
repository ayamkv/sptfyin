<script>
	import Ellipsis from "lucide-svelte/icons/ellipsis";
	import { cn } from "$lib/utils.js";
	let { class: className = undefined, ...rest } = $props();
	
</script>

<span
	aria-hidden="true"
	class={cn("flex h-9 w-9 items-center justify-center", className)}
	{...rest}
>
	<Ellipsis class="h-4 w-4" />
	<span class="sr-only">More pages</span>
</span>
