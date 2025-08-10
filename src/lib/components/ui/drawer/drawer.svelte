<script>
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	/**
	 * @typedef {Object} Props
	 * @property {boolean} [shouldScaleBackground]
	 * @property {boolean} [open]
	 * @property {any} [activeSnapPoint]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let {
		shouldScaleBackground = true,
		open = $bindable(false),
		activeSnapPoint = $bindable(undefined),
		children,
		...rest
	} = $props();
</script>

<DrawerPrimitive.Root {shouldScaleBackground} bind:open bind:activeSnapPoint {...rest}>
	{@render children?.()}
</DrawerPrimitive.Root>
