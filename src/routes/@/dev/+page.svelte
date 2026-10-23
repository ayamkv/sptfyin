<script>
	import { Button } from '$lib/components/ui/button';
	import { resolve } from '$app/paths';

	let { data } = $props();

	function refreshPage() {
		window.location.reload();
	}
</script>

<div class="container mx-auto max-w-4xl py-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-foreground">Dev diagnostics</h1>
		<Button onclick={refreshPage}>Refresh</Button>
	</div>

	<div class="space-y-4">
		<section class="rounded-lg border border-border p-4">
			<h2 class="mb-2 text-lg font-semibold text-foreground">Environment</h2>
			<pre class="overflow-auto rounded bg-background p-3 text-sm text-muted-foreground">
PocketBase URL: {data.pocketBaseUrl || 'Not configured'}
Mode: {import.meta.env.MODE}
Checked at: {data.timestamp}</pre>
		</section>

		<section class="rounded-lg border border-border p-4">
			<h2 class="mb-4 text-lg font-semibold text-foreground">PocketBase</h2>
			<div class="space-y-3">
				{#each data.checks as check (check.name)}
					<div
						class="rounded border p-3 {check.status === 'success'
							? 'border-green-500/30 bg-green-500/10'
							: 'border-red-500/30 bg-red-500/10'}"
					>
						<div class="mb-2 flex items-center gap-2">
							<span class="font-medium text-foreground">{check.name}</span>
							<span
								class="rounded px-2 py-1 text-xs {check.status === 'success'
									? 'bg-green-500/20 text-green-400'
									: 'bg-red-500/20 text-red-400'}"
							>
								{check.status.toUpperCase()}
							</span>
						</div>

						{#if check.status === 'success'}
							<pre
								class="overflow-auto rounded border border-border bg-background p-2 text-xs text-muted-foreground">{JSON.stringify(
									check.result,
									null,
									2
								)}</pre>
						{:else}
							<div class="text-sm text-foreground">
								<p><strong>Error:</strong> {check.error.message}</p>
								{#if check.error.status}
									<p><strong>Status:</strong> {check.error.status}</p>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		<section class="rounded-lg border border-border p-4">
			<h2 class="mb-2 text-lg font-semibold text-foreground">Auth</h2>
			<pre
				class="overflow-auto rounded bg-background p-3 text-sm text-muted-foreground">{JSON.stringify(
					{ authState: data.authState, user: data.user, cookieNames: data.cookieNames },
					null,
					2
				)}</pre>
			<div class="mt-3 space-y-2">
				<a
					href={resolve('/@/auth/clear')}
					class="inline-block rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
				>
					Clear all auth state
				</a>
				<p class="text-sm text-muted-foreground">Use this if you're stuck in a bad auth state.</p>
			</div>
		</section>
	</div>
</div>
