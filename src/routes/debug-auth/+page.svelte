<script>
	export let data;
	import { onMount } from 'svelte';

	onMount(() => {
		// Update cookies display
		const cookiesElement = document.getElementById('cookies');
		if (cookiesElement) {
			cookiesElement.textContent = document.cookie || 'No cookies found';
		}
	});
</script>

<div class="container mx-auto max-w-2xl py-6">
	<h1 class="mb-6 text-2xl font-bold">Authentication Debug</h1>

	<div class="space-y-4">
		<div class="rounded-lg border p-4">
			<h2 class="mb-2 text-lg font-semibold">Server State</h2>
			<pre class="overflow-auto rounded bg-background p-2 text-sm">{JSON.stringify(
					data,
					null,
					2
				)}</pre>
		</div>

		<div class="rounded-lg border p-4">
			<h2 class="mb-2 text-lg font-semibold">Browser Cookies</h2>
			<pre class="overflow-auto rounded bg-background p-2 text-sm" id="cookies">Loading...</pre>
		</div>

		<div class="rounded-lg border p-4">
			<h2 class="mb-2 text-lg font-semibold">Environment</h2>
			<pre class="overflow-auto rounded bg-background p-2 text-sm">
VITE_POCKETBASE_URL: {import.meta.env.VITE_POCKETBASE_URL}
VITE_APP_URL: {import.meta.env.VITE_APP_URL}
Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}
      </pre>
		</div>

		<div class="rounded-lg border p-4">
			<h2 class="mb-2 text-lg font-semibold">Debug Actions</h2>
			<div class="space-y-2">
				<a
					href="/auth/clear"
					class="inline-block rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
				>
					Clear All Auth State
				</a>
				<p class="text-sm text-gray-600">Use this if you're stuck in a bad auth state</p>
			</div>
		</div>
	</div>
</div>
