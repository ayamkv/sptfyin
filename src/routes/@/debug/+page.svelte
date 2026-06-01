<script>
	import { enhance } from '$app/forms';
	let { data } = $props();
	let deleteLoading = $state(false);
	let deleteResult = $state(null);

	function copyIds() {
		const ids = data.botIds;
		const arrayString = `[${ids.join(', ')}]`;
		navigator.clipboard.writeText(arrayString);
	}

	async function handleDeleteResponse({ result }) {
		deleteResult = result.data;
		setTimeout(() => {
			deleteResult = null;
		}, 5000);
	}
</script>

<div class="container mx-auto p-8">
	<div class="mb-6 flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Debug: Bot Management</h1>
			<div class="flex gap-2">
				<form
					method="POST"
					action="?/deleteBots"
					use:enhance={() => {
						deleteLoading = true;
						return async ({ result, update }) => {
							await update();
							deleteLoading = false;
							await handleDeleteResponse({ result });
						};
					}}
				>
					<button
						class="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
						disabled={deleteLoading}
					>
						{deleteLoading ? 'Deleting...' : 'Delete All Bots'}
					</button>
				</form>
			</div>
		</div>

		{#if deleteResult}
			<div
				class={`rounded p-4 ${deleteResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
			>
				{deleteResult.success
					? `Successfully deleted ${deleteResult.deletedCount} bot records`
					: `Error: ${deleteResult.error}`}
			</div>
		{/if}
	</div>

	<div class="mt-4">
		<h2 class="mb-4 text-lg font-semibold">Bot IDs to Delete ({data.botIds.length})</h2>
		<div class="rounded-lg bg-gray-50 p-4">
			<div class="mb-4 flex items-center justify-between">
				<p class="text-sm text-gray-600">Total IDs: {data.botIds.length}</p>
				<button
					onclick={copyIds}
					class="flex items-center gap-2 rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-200"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path
							d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
						/></svg
					>
					Copy IDs Array
				</button>
			</div>
			<div class="max-h-96 overflow-y-auto font-mono text-sm">
				<pre class="whitespace-pre-wrap break-all">{JSON.stringify(data.botIds, null, 2)}</pre>
			</div>
		</div>
	</div>
</div>
