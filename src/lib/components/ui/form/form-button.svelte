<script>
	import * as Button from "$lib/components/ui/button/index.js";
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { children, ...rest } = $props();
</script>

<Button.Root type="submit" on:click on:keydown {...rest}>
	{@render children?.()}
</Button.Root>
