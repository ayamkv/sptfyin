<script>
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props & { [key: string]: any }} */
	let { children, ...rest } = $props();
</script>

<AlertDialogPrimitive.Portal {...rest}>
	{@render children?.()}
</AlertDialogPrimitive.Portal>
