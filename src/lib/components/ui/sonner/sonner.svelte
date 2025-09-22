<script>
	import { Toaster as Sonner } from 'svelte-sonner';
	import { mode } from 'mode-watcher';
	/** @type {{ [key: string]: any }} */
	let { ...rest } = $props();
</script>

<Sonner
	theme={$mode}
	class="toaster group"
	toastOptions={{
		classes: {
			toast:
				'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:highlightSecondary text-lg ',
			description: 'group-[.toast]:text-muted-foreground',
			actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
			cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground'
		}
	}}
	{...rest}
/>
