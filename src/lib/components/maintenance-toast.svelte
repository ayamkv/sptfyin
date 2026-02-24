<script>
	import { onMount } from 'svelte';
	import {
		getMaintenanceState,
		getTimeRemaining,
		formatTimeRemaining,
		getStatusPageUrl
	} from '$lib/maintenance.js';

	let state = $state(getMaintenanceState());
	let dismissed = $state(false);
	let minimized = $state(false);
	let countdown = $state(null);
	let hydrated = $state(false);

	const STORAGE_KEY_PREFIX = 'maintenance_dismissed_';
	const MINIMIZED_STORAGE_KEY_PREFIX = 'maintenance_minimized_';
	const statusPageUrl = getStatusPageUrl();
	const isMigration = $derived(state.type === 'migration');

	function getStorageKey() {
		return STORAGE_KEY_PREFIX + (state.message || '');
	}

	function getMinimizedStorageKey() {
		return MINIMIZED_STORAGE_KEY_PREFIX + (state.message || '');
	}

	function dismiss() {
		dismissed = true;
		if (state.status !== 'scheduled') return;

		try {
			localStorage.setItem(getStorageKey(), 'true');
		} catch {
			// localStorage might not be available
		}
	}

	function toggleMinimized() {
		if (!isMigration) {
			dismiss();
			return;
		}

		const nextMinimized = !minimized;
		minimized = nextMinimized;

		if (state.status !== 'scheduled') return;

		try {
			if (nextMinimized) {
				localStorage.setItem(getMinimizedStorageKey(), 'true');
			} else {
				localStorage.removeItem(getMinimizedStorageKey());
			}
		} catch {
			// localStorage might not be available
		}
	}

	function updateCountdown() {
		if (state.status === 'scheduled' && state.scheduledDate) {
			const remaining = getTimeRemaining(state.scheduledDate);
			if (remaining.total > 0) {
				countdown = `will start in ${formatTimeRemaining(remaining)}`;
			} else {
				// Maintenance time reached, refresh state
				state = getMaintenanceState();
				if (state.status === 'active' && state.type === 'migration') {
					minimized = false;
				}
				countdown = null;
			}
		} else {
			countdown = null;
		}
	}

	onMount(() => {
		// Check if this specific message was dismissed
		if (state.status === 'scheduled') {
			try {
				if (state.type === 'migration') {
					const wasMinimized = localStorage.getItem(getMinimizedStorageKey());
					if (wasMinimized === 'true') {
						minimized = true;
					}
				} else {
					const wasDismissed = localStorage.getItem(getStorageKey());
					if (wasDismissed === 'true') {
						dismissed = true;
					}
				}
			} catch {
				// localStorage might not be available
			}
		}

		// Initial countdown update
		updateCountdown();
		hydrated = true;

		if (state.status !== 'scheduled' || !state.scheduledDate) {
			return;
		}

		const interval = setInterval(() => {
			updateCountdown();
			if (state.status !== 'scheduled' || !state.scheduledDate) {
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

{#if hydrated && state.status !== 'normal' && (isMigration || !dismissed)}
	<div class="fixed left-1/2 top-4 z-[100] w-full max-w-md -translate-x-1/2 px-4">
		<div
			class="flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm {state.status ===
			'active'
				? 'border-red-500/30 bg-red-500/10 text-red-200'
				: 'border-amber-500/30 bg-amber-500/10 text-amber-200'}"
		>
			{#if state.status === 'active'}
				<iconify-icon icon="lucide:construction" class="shrink-0 text-xl"></iconify-icon>
			{:else}
				<iconify-icon icon="lucide:alert-triangle" class="shrink-0 text-xl"></iconify-icon>
			{/if}

			<div class="min-w-0 flex-1">
				{#if !isMigration || !minimized}
					<span class="font-medium">{state.message}</span>
					{#if countdown}
						<div class="text-sm opacity-80">{countdown}</div>
					{/if}
					{#if state.note}
						<div class="text-sm opacity-80">{state.note}</div>
					{/if}
					<div class="mt-1 text-sm opacity-80">
						<a
							href={statusPageUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="transition-opacity hover:underline hover:opacity-100"
						>
							view server status
						</a>
					</div>
				{:else}
					<span class="font-medium"
						>{state.status === 'active'
							? 'Migration maintenance in progress.'
							: 'Migration maintenance starts soon.'}</span
					>
					{#if countdown}
						<div class="text-sm opacity-80">{countdown}</div>
					{/if}
				{/if}
			</div>

			{#if isMigration}
				<button
					onclick={toggleMinimized}
					class="shrink-0 rounded p-1 transition-colors hover:bg-white/10"
					aria-label={minimized
						? 'Expand migration maintenance notice'
						: 'Minimize migration maintenance notice'}
					aria-expanded={!minimized}
				>
					<iconify-icon icon={minimized ? 'lucide:maximize-2' : 'lucide:minimize-2'} class="text-lg"
					></iconify-icon>
				</button>
			{:else}
				<button
					onclick={dismiss}
					class="shrink-0 rounded p-1 transition-colors hover:bg-white/10"
					aria-label="Dismiss notification"
				>
					<iconify-icon icon="lucide:x" class="text-lg"></iconify-icon>
				</button>
			{/if}
		</div>
	</div>
{/if}
