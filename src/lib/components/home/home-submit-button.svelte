<script>
	import { fly } from 'svelte/transition';

	import { Button } from '$lib/components/ui/button';

	let {
		loading = false,
		maintenanceActive = false,
		turnstileStatus = 'pending',
		disabled = false,
		class: className = ''
	} = $props();

	let isValidating = $derived(!maintenanceActive && !loading && turnstileStatus !== 'verified');
	let submitButtonState = $derived(
		maintenanceActive ? 'maintenance' : loading ? 'loading' : isValidating ? 'validating' : 'ready'
	);
	let submitButtonLabel = $derived(
		maintenanceActive
			? 'maintenance...'
			: loading
				? 'loading...'
				: isValidating
					? 'validating...'
					: 'short It!'
	);
</script>

<Button class={className} type="submit" {disabled}>
	<span class="flex w-[2.125rem] shrink-0 items-center justify-center">
		{#if isValidating}
			<span class="waverows-spinner shrink-0" aria-hidden="true"></span>
		{:else}
			<iconify-icon
				icon={loading ? 'lucide:loader' : 'lucide:scissors'}
				class="h-[18px] w-[18px] shrink-0 {loading ? 'animate-spin [transform-origin:center]' : ''}"
				width="18"
			></iconify-icon>
		{/if}
	</span>
	<span class="relative flex h-5 flex-1 items-center justify-center overflow-hidden">
		{#key submitButtonState}
			<span
				class="absolute inset-0 flex items-center justify-center"
				in:fly={{ y: 12, duration: 160 }}
				out:fly={{ y: -12, duration: 120 }}
			>
				{submitButtonLabel}
			</span>
		{/key}
	</span>
	<div
		class="flex w-4 shrink-0 items-center justify-center gap-1 text-xs {loading ? 'invisible' : ''}"
		aria-hidden={loading ? 'true' : undefined}
	>
		{#if !loading}
			{#if turnstileStatus === 'verified'}
				<iconify-icon icon="lucide:shield-check" class="h-4 w-4 text-emerald-900"></iconify-icon>
			{:else if turnstileStatus === 'error' || turnstileStatus === 'expired'}
				<iconify-icon icon="lucide:shield-question-mark" class="h-4 w-4 text-red-900"
				></iconify-icon>
			{:else}
				<iconify-icon icon="lucide:shield" class="h-4 w-4 animate-pulse"></iconify-icon>
			{/if}
		{/if}
	</div>
</Button>

<style>
	.waverows-spinner {
		display: inline-flex;
		width: 2.125rem;
		height: 1.125rem;
		align-items: center;
		justify-content: center;
		font-family: monospace;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: -0.16em;
		line-height: 1;
		white-space: pre;
	}

	.waverows-spinner::after {
		animation: waverows-spinner 1.44s steps(1, end) infinite;
		content: '⠖⠉⠉⠑';
	}

	@keyframes waverows-spinner {
		0% {
			content: '⠖⠉⠉⠑';
		}

		6.25% {
			content: '⡠⠖⠉⠉';
		}

		12.5% {
			content: '⣠⡠⠖⠉';
		}

		18.75% {
			content: '⣄⣠⡠⠖';
		}

		25% {
			content: '⠢⣄⣠⡠';
		}

		31.25% {
			content: '⠙⠢⣄⣠';
		}

		37.5% {
			content: '⠉⠙⠢⣄';
		}

		43.75% {
			content: '⠊⠉⠙⠢';
		}

		50% {
			content: '⠜⠊⠉⠙';
		}

		56.25% {
			content: '⡤⠜⠊⠉';
		}

		62.5% {
			content: '⣀⡤⠜⠊';
		}

		68.75% {
			content: '⢤⣀⡤⠜';
		}

		75% {
			content: '⠣⢤⣀⡤';
		}

		81.25% {
			content: '⠑⠣⢤⣀';
		}

		87.5% {
			content: '⠉⠑⠣⢤';
		}

		93.75% {
			content: '⠋⠉⠑⠣';
		}
	}
</style>
