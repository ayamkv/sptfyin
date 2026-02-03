<script>
	export let data;
	import { Button } from '$lib/components/ui/button';

	function refreshPage() {
		window.location.reload();
	}
</script>

<div class="container mx-auto max-w-4xl py-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-foreground">PocketBase Connection Test</h1>
		<Button onclick={refreshPage}>Refresh Test</Button>
	</div>

	<div class="space-y-4">
		<div class="rounded-lg border border-border p-4">
			<h2 class="mb-2 text-lg font-semibold text-foreground">Configuration</h2>
			<pre class="overflow-auto rounded bg-background p-3 text-sm text-muted-foreground">
PocketBase URL: {data.results.url || 'Not configured'}
Test Time: {data.results.timestamp}
Environment: {import.meta.env.MODE}
      </pre>
		</div>

		<div class="rounded-lg border border-border p-4">
			<h2 class="mb-4 text-lg font-semibold text-foreground">Connection Tests</h2>
			<div class="space-y-3">
				{#each data.results.tests as test}
					<div
						class="rounded border p-3 {test.status === 'success'
							? 'border-green-500/30 bg-green-500/10'
							: 'border-red-500/30 bg-red-500/10'}"
					>
						<div class="mb-2 flex items-center gap-2">
							<span class="font-medium text-foreground">{test.name}</span>
							<span
								class="rounded px-2 py-1 text-xs {test.status === 'success'
									? 'bg-green-500/20 text-green-400'
									: 'bg-red-500/20 text-red-400'}"
							>
								{test.status.toUpperCase()}
							</span>
						</div>

						{#if test.status === 'success'}
							<pre
								class="overflow-auto rounded border border-border bg-background p-2 text-xs text-muted-foreground">{JSON.stringify(
									test.result,
									null,
									2
								)}</pre>
						{:else}
							<div class="text-sm text-foreground">
								<p><strong>Error:</strong> {test.error.message}</p>
								{#if test.error.status}
									<p><strong>Status:</strong> {test.error.status}</p>
								{/if}
								{#if test.error.code}
									<p><strong>Code:</strong> {test.error.code}</p>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<div class="rounded-lg border border-border p-4">
			<h2 class="mb-2 text-lg font-semibold text-foreground">Troubleshooting</h2>
			<div class="space-y-2 text-sm">
				{#if data.results.tests.some((t) => t.status === 'error')}
					<div class="rounded border border-orange-500/30 bg-orange-500/10 p-3">
						<p class="font-medium text-orange-400">Connection Issues Detected</p>
						<ul class="mt-2 space-y-1 text-xs text-muted-foreground">
							<li>• Check if PocketBase server is running</li>
							<li>• Verify VITE_POCKETBASE_URL environment variable</li>
							<li>• Ensure PocketBase is accessible from this domain</li>
							<li>• Check firewall and network connectivity</li>
						</ul>
					</div>
				{:else}
					<div class="rounded border border-green-500/30 bg-green-500/10 p-3">
						<p class="font-medium text-green-400">✅ All connections successful!</p>
					</div>
				{/if}

				<div class="mt-4">
					<p class="font-medium text-foreground">Quick Actions:</p>
					<div class="mt-2 flex gap-2">
						<a href="/debug-auth" class="text-sm text-primary hover:text-primary/80 hover:underline"
							>Debug Auth State</a
						>
						<a href="/login" class="text-sm text-primary hover:text-primary/80 hover:underline"
							>Try Login</a
						>
						<a href="/" class="text-sm text-primary hover:text-primary/80 hover:underline">Home</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
