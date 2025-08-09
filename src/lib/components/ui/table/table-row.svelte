<script>
    import { cn } from "$lib/utils.js";
    let { class: className = undefined, children, ...rest } = $props();
    
    // Events are forwarded via `{...rest}` so parents can pass onclick/keydown, etc.
</script>

<tr
	class={cn(
		"border-b transition-colors hover:bg-secondary/50 data-[state=selected]:bg-secondary",
		className
	)}
    {...rest}
>
	{@render children?.()}
</tr>
